import { environment } from '@/environments'
import { store } from '@/store'
import { forceLogout, requirePasswordChange, setTokens } from '@/store/features/auth/authSlice'
import { persistor } from '@/store'
import { router } from '@/navigation/router'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type SafeErrorPayload = {
	code?: unknown
	reconcilable?: unknown
}

const safeMessageForStatus = (status: number) => {
	const safeMessages: Record<number, string> = {
		400: 'The request could not be completed. Check the information and try again.',
		403: 'You do not have permission to perform this action.',
		404: 'The requested resource was not found.',
		409: 'The request conflicts with the current state. Refresh and try again.',
		429: 'Too many requests. Wait a moment and try again.',
	}
	return safeMessages[status] ?? (status >= 500 ? 'The service is temporarily unavailable.' : 'The request could not be completed.')
}

export class ApiError extends Error {
	readonly status: number
	readonly code?: string
	readonly reconcilable: boolean

	constructor({ status, code, reconcilable = false, message }: { status: number; code?: string; reconcilable?: boolean; message?: string }) {
		super(message ?? safeMessageForStatus(status))
		this.name = 'ApiError'
		this.status = status
		this.code = code
		this.reconcilable = reconcilable
	}
}

export const isApiError = (value: unknown): value is ApiError => value instanceof ApiError

// ── Logout handler ──────────────────────────────────────────────────────

let isHandlingUnauthorized = false
const pendingRequests = new Set<AbortController>()
const REDIRECT_DELAY_MS = 100

export const handleUnauthorizedAccess = () => {
	if (isHandlingUnauthorized) return
	isHandlingUnauthorized = true

	pendingRequests.forEach((ctrl) => {
		try {
			ctrl.abort('Session expired')
		} catch {
			/* ignore */
		}
	})
	pendingRequests.clear()

	if (!window.location.pathname.includes('/login')) {
		store.dispatch(forceLogout())
		void persistor.purge().catch(() => { /* In-memory credentials are already cleared. */ })
		sessionStorage.clear()
		try {
			localStorage.removeItem('persist:root')
		} catch {
			/* ignore */
		}
		setTimeout(() => {
			isHandlingUnauthorized = false
			router.navigate('/login')
		}, REDIRECT_DELAY_MS)
	} else {
		isHandlingUnauthorized = false
	}
}

// ── Refresh token lock ───────────────────────────────────────────────────
// One concurrent refresh at most

let refreshPromise: Promise<boolean> | null = null

const tryRefreshToken = async (): Promise<boolean> => {
	if (refreshPromise) return refreshPromise

	refreshPromise = (async () => {
		const { refreshToken } = store.getState().auth
		if (!refreshToken) return false
		try {
			const url = `${environment.baseUrl}${environment.apiRoutes.auth.refresh}`
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken }),
			})
			if (!res.ok) return false
			const data = await res.json()
			store.dispatch(setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken }))
			return true
		} catch {
			return false
		} finally {
			refreshPromise = null
		}
	})()

	return refreshPromise
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type QueryParams = Record<string, string | number | boolean | undefined | null>

const buildQueryString = (params?: QueryParams): string => {
	if (!params) return ''
	const pairs = Object.entries(params)
		.filter(([, v]) => v !== null && v !== undefined)
		.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
	return pairs.length ? `?${pairs.join('&')}` : ''
}

const parseResponse = async (res: Response): Promise<any> => {
	if (res.status === 204 || res.headers.get('content-length') === '0') return undefined
	const ct = res.headers.get('content-type') ?? ''
	if (ct.includes('application/json')) {
		try { return await res.json() }
		catch { return undefined }
	}
	if (ct.includes('text/')) return res.text()
	return res.blob()
}

// ── Main customFetch ──────────────────────────────────────────────────────────────

type CustomFetchOptions = {
	method?: HttpMethod
	headers?: Record<string, string>
	body?: any
	params?: QueryParams
	signal?: AbortSignal
	baseURL?: string
	onResponse?: (response: Response) => void
	/** Internal: skip the one-retry-after-refresh to avoid infinite loops */
	_skipRefresh?: boolean
}

export const customFetch = async <T = any>(
	endpoint: string,
	options: CustomFetchOptions = {}
): Promise<T> => {
	const {
		method = 'GET',
		headers: extraHeaders = {},
		body,
		params,
		signal: callerSignal,
		baseURL = environment.baseUrl,
		onResponse,
		_skipRefresh = false,
	} = options

	const url = baseURL + endpoint + buildQueryString(params)

	const controller = new AbortController()
	pendingRequests.add(controller)
	if (callerSignal) {
		if (callerSignal.aborted) controller.abort(callerSignal.reason)
		else callerSignal.addEventListener('abort', () => controller.abort(callerSignal.reason))
	}

	const accessToken = store.getState().auth.accessToken

	const isJsonBody =
		body !== undefined &&
		typeof body === 'object' &&
		!(body instanceof FormData) &&
		!(body instanceof Blob)

	const requestHeaders: Record<string, string> = {
		...extraHeaders,
		...(accessToken && { Authorization: `Bearer ${accessToken}` }),
		...(isJsonBody && { 'Content-Type': 'application/json' }),
	}

	const init: RequestInit = {
		method,
		headers: requestHeaders,
		signal: controller.signal,
		...(body !== undefined && method !== 'GET'
			? { body: isJsonBody ? JSON.stringify(body) : body }
			: {}),
	}

	try {
		const res = await fetch(url, init)
		onResponse?.(res)
		const data = await parseResponse(res)

		if (!res.ok) {
			const payload = data && typeof data === 'object' && !(data instanceof Blob) ? data as SafeErrorPayload : undefined
			const code = typeof payload?.code === 'string' ? payload.code : undefined
			const reconcilable = payload?.reconcilable === true

			if (res.status === 403 && code === 'password_change_required') {
				store.dispatch(requirePasswordChange())
				if (window.location.pathname !== '/change-password') void router.navigate('/change-password', { replace: true })
				throw new ApiError({ status: res.status, code, reconcilable, message: 'Change your temporary password to continue.' })
			}

			if (res.status === 401 && !_skipRefresh && !store.getState().auth.requiresPasswordChange) {
				const refreshed = await tryRefreshToken()
				if (refreshed) {
					pendingRequests.delete(controller)
					return customFetch<T>(endpoint, { ...options, _skipRefresh: true })
				} else {
					handleUnauthorizedAccess()
					throw new ApiError({ status: 401, code: 'session_expired', message: 'Session expired. Sign in again.' })
				}
			}

			throw new ApiError({ status: res.status, code, reconcilable })
		}

		return data as T
	} catch (err) {
		if (err instanceof Error && err.name === 'AbortError') throw new ApiError({ status: 0, code: 'request_cancelled', message: 'Request cancelled.' })
		throw err
	} finally {
		pendingRequests.delete(controller)
	}
}

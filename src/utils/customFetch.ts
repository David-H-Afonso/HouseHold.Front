import { environment } from '@/environments'
import { store } from '@/store'
import { forceLogout, setTokens } from '@/store/features/auth/authSlice'
import { persistor } from '@/store'
import { router } from '@/navigation/router'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

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
		console.warn('[Auth] Session expired — redirecting to login')
		store.dispatch(forceLogout())
		persistor.purge().catch(console.error)
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
	const ct = res.headers.get('content-type') ?? ''
	if (ct.includes('application/json')) return res.json()
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
		const data = await parseResponse(res)

		if (!res.ok) {
			if (res.status === 401 && !_skipRefresh) {
				const refreshed = await tryRefreshToken()
				if (refreshed) {
					pendingRequests.delete(controller)
					return customFetch<T>(endpoint, { ...options, _skipRefresh: true })
				} else {
					handleUnauthorizedAccess()
					throw new Error('Session expired. Please login again.')
				}
			}

			const msg = typeof data === 'string' ? data : (data?.message ?? JSON.stringify(data))
			throw new Error(`HTTP ${res.status}: ${msg}`)
		}

		return data as T
	} catch (err) {
		if (err instanceof Error && err.name === 'AbortError') throw new Error('Request cancelled')
		throw err
	} finally {
		pendingRequests.delete(controller)
	}
}

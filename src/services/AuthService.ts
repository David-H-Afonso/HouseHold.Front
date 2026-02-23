import { environment } from '@/environments'
import { customFetch } from '@/utils'
import type {
	CreateUserRequest,
	LoginRequest,
	LoginResponse,
	MeResponse,
	UserDto,
} from '@/models/api/Auth'

const { auth, admin } = environment.apiRoutes

/**
 * Auth Service
 * login/refresh/logout use native fetch to avoid circular dependency with customFetch.
 * All other calls (me, logout-all, adminCreateUser) go through customFetch.
 */
class AuthService {
	/** Login — returns tokens and basic user info */
	async login(credentials: LoginRequest): Promise<LoginResponse> {
		const url = `${environment.baseUrl}${auth.login}`
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(credentials),
		})
		if (!res.ok) {
			if (res.status === 401) throw new Error('Invalid email or password')
			const err = await res.json().catch(() => ({}))
			throw new Error(err.message || `Login failed (HTTP ${res.status})`)
		}
		return res.json()
	}

	/** Revoke current refresh token */
	async logout(refreshToken: string): Promise<void> {
		const url = `${environment.baseUrl}${auth.logout}`
		await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refreshToken }),
		}).catch(() => {
			/* best-effort */
		})
	}

	/** Revoke all refresh tokens for the current user */
	async logoutAll(): Promise<{ message: string }> {
		return customFetch(auth.logoutAll, { method: 'POST' })
	}

	/** Get current user info from token claims (no DB roundtrip) */
	async me(): Promise<MeResponse> {
		return customFetch<MeResponse>(auth.me)
	}

	/** Admin: create a new user */
	async adminCreateUser(request: CreateUserRequest): Promise<UserDto> {
		return customFetch<UserDto>(admin.createUser, { method: 'POST', body: request })
	}
}

export const authService = new AuthService()

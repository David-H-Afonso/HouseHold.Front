import { environment } from '@/environments'
import { customFetch } from '@/utils/customFetch'
import type {
	ChangePasswordRequest,
	ChangePasswordResponse,
	CreateUserRequest,
	CreateUserResponse,
	LoginRequest,
	LoginResponse,
	MeResponse,
	UserDto,
} from '@/models/api/Auth'
import type { RedeemInvitationRequest } from '@/models/api/Operations'

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
			throw new Error(res.status === 429 ? 'Too many sign-in attempts. Wait and try again.' : 'Sign in is temporarily unavailable.')
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

	async changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
		return customFetch<ChangePasswordResponse>(auth.changePassword, { method: 'POST', body: request })
	}

	/** Admin: create a new user */
	async adminCreateUser(request: CreateUserRequest): Promise<CreateUserResponse> {
		return customFetch<CreateUserResponse>(admin.createUser, { method: 'POST', body: request })
	}

	async redeemInvitation(request: RedeemInvitationRequest): Promise<UserDto> {
		const response = await fetch(`${environment.baseUrl}${environment.apiRoutes.invitations.redeem}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(request),
		})
		if (!response.ok) {
			throw new Error(response.status === 429 ? 'Too many attempts. Wait and try again.' : 'This invitation is invalid or has expired.')
		}
		return response.json()
	}
}

export const authService = new AuthService()

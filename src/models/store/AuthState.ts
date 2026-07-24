import type { MeResponse } from '@/models/api/Auth'

export interface AuthState {
	isAuthenticated: boolean
	requiresPasswordChange: boolean
	user: MeResponse | null
	accessToken: string | null
	refreshToken: string | null
	loading: boolean
	error: string | null
}

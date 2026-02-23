// ── Auth API models ────────────────────────────────────────────────────────

export interface LoginRequest {
	email: string
	password: string
}

export interface LoginResponse {
	userId: string
	email: string
	userName: string
	isAdmin: boolean
	accessToken: string
	refreshToken: string
	accessTokenExpiresAt: string
}

export interface RefreshRequest {
	refreshToken: string
	deviceName?: string
}

export interface RefreshResponse {
	accessToken: string
	refreshToken: string
	accessTokenExpiresAt: string
}

export interface LogoutRequest {
	refreshToken: string
}

export interface MeResponse {
	userId: string
	email: string
	userName: string
	isAdmin: boolean
}

export interface CreateUserRequest {
	email: string
	userName: string
	password: string
	isAdmin?: boolean
}

export interface UserDto {
	id: string
	email: string
	userName: string
	isAdmin: boolean
	isActive: boolean
	createdAt: string
	updatedAt: string
}

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
	requiresPasswordChange: boolean
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

export interface ChangePasswordRequest {
	currentPassword: string
	newPassword: string
}

export interface ChangePasswordResponse {
	code: 'password_changed'
	reauthenticationRequired: true
}

export interface MeResponse {
	userId: string
	email: string
	userName: string
	isAdmin: boolean
	requiresPasswordChange: boolean
}

export interface CreateUserRequest {
	email: string
	userName: string
	temporaryPassword?: string | null
	isAdmin?: boolean
}

export interface CreateUserResponse {
	user: UserDto
	temporaryPassword?: string | null
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

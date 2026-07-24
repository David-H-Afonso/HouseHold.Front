import type { RootState } from '@/store'

export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectRequiresPasswordChange = (state: RootState) => state.auth.requiresPasswordChange
export const selectCurrentUser = (state: RootState) => state.auth.user
export const selectIsAdmin = (state: RootState) => state.auth.user?.isAdmin ?? false
export const selectAccessToken = (state: RootState) => state.auth.accessToken
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken
export const selectAuthLoading = (state: RootState) => state.auth.loading
export const selectAuthError = (state: RootState) => state.auth.error

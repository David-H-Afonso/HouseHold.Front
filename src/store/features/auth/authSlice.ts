import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { LoginRequest, MeResponse } from '@/models/api/Auth'
import type { AuthState } from '@/models/store/AuthState'
import { environment } from '@/environments'

const initialState: AuthState = {
	isAuthenticated: false,
	user: null,
	accessToken: null,
	refreshToken: null,
	loading: false,
	error: null,
}

// ── Thunks ────────────────────────────────────────────────────────────────

/**
 * Login: uses native fetch to avoid circular dependency with customFetch
 * (customFetch imports the store, which imports this slice)
 */
export const loginUser = createAsyncThunk(
	'auth/login',
	async (credentials: LoginRequest, { rejectWithValue }) => {
		try {
			const url = `${environment.baseUrl}${environment.apiRoutes.auth.login}`
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

			return await res.json()
		} catch (e) {
			return rejectWithValue(e instanceof Error ? e.message : 'Login failed')
		}
	}
)

/** Fetch the current user info from /auth/me (requires valid access token) */
export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue, getState }) => {
	try {
		const { auth } = getState() as { auth: AuthState }
		const url = `${environment.baseUrl}${environment.apiRoutes.auth.me}`
		const res = await fetch(url, {
			headers: { Authorization: `Bearer ${auth.accessToken}` },
		})
		if (!res.ok) throw new Error('Failed to fetch user info')
		return (await res.json()) as MeResponse
	} catch (e) {
		return rejectWithValue(e instanceof Error ? e.message : 'Failed to fetch user info')
	}
})

// ── Slice ─────────────────────────────────────────────────────────────────

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		clearError: (state) => {
			state.error = null
		},

		/** Update both tokens (called by customFetch after a successful refresh) */
		setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
			state.accessToken = action.payload.accessToken
			state.refreshToken = action.payload.refreshToken
		},

		/** Force logout — called by customFetch when refresh fails */
		forceLogout: (state) => {
			state.isAuthenticated = false
			state.user = null
			state.accessToken = null
			state.refreshToken = null
			state.error = null
		},

		/** Manual logout — stores the refresh token so the service can revoke it */
		logout: (state) => {
			state.isAuthenticated = false
			state.user = null
			state.accessToken = null
			state.refreshToken = null
			state.error = null
		},
	},
	extraReducers: (builder) => {
		// loginUser
		builder
			.addCase(loginUser.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(loginUser.fulfilled, (state, action) => {
				state.loading = false
				state.isAuthenticated = true
				state.accessToken = action.payload.accessToken
				state.refreshToken = action.payload.refreshToken
				state.user = {
					userId: action.payload.userId,
					email: action.payload.email,
					userName: action.payload.userName,
					isAdmin: action.payload.isAdmin,
				}
				state.error = null
			})
			.addCase(loginUser.rejected, (state, action) => {
				state.loading = false
				state.isAuthenticated = false
				state.accessToken = null
				state.refreshToken = null
				state.user = null
				state.error = action.payload as string
			})

		// fetchMe
		builder.addCase(fetchMe.fulfilled, (state, action) => {
			state.user = action.payload
		})
	},
})

export const { clearError, forceLogout, logout, setTokens } = authSlice.actions
export default authSlice.reducer

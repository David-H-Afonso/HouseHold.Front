import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import { combineReducers } from '@reduxjs/toolkit'
import storage from 'redux-persist/lib/storage'
import type { PersistedState } from 'redux-persist'
import { authReducer } from './features/auth'
import type { AuthState } from '@/models/store/AuthState'

const migrateAuthState = (state: PersistedState) => {
	const persisted = state as (PersistedState & { auth?: Partial<AuthState> }) | undefined
	if (persisted?.auth && typeof persisted.auth.requiresPasswordChange !== 'boolean') {
		persisted.auth.requiresPasswordChange = persisted.auth.user?.requiresPasswordChange === true
	}
	return Promise.resolve(persisted)
}

const persistConfig = {
	key: 'root',
	storage,
	whitelist: ['auth'],
	version: 2,
	migrate: migrateAuthState,
}

const rootReducer = combineReducers({
	auth: authReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [
					'persist/FLUSH',
					'persist/REHYDRATE',
					'persist/PAUSE',
					'persist/PERSIST',
					'persist/PURGE',
					'persist/REGISTER',
				],
			},
		}),
	devTools: process.env.NODE_ENV !== 'production',
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store

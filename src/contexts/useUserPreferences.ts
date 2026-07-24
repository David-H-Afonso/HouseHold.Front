import { createContext, useContext } from 'react'
import type { UserPreferences } from '@/models/api/Preferences'
import type { PreferencePersistence } from '@/services/PreferencesService'

export interface UserPreferencesContextValue {
	preferences: UserPreferences
	ready: boolean
	saving: boolean
	persistence: PreferencePersistence
	updatePreferences: (update: Partial<UserPreferences> | ((current: UserPreferences) => UserPreferences)) => Promise<void>
	resetPreferences: () => void
}

export const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null)

export const useUserPreferences = () => {
	const value = useContext(UserPreferencesContext)
	if (!value) throw new Error('useUserPreferences must be used inside UserPreferencesProvider')
	return value
}

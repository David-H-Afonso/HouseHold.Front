import { createDefaultPreferences } from '@/models/api/Preferences'
import type { UserPreferencesContextValue } from '@/contexts/useUserPreferences'

export const preferencesValue = (overrides: Partial<UserPreferencesContextValue> = {}): UserPreferencesContextValue => ({
	preferences: createDefaultPreferences(),
	ready: true,
	saving: false,
	persistence: 'server',
	updatePreferences: async () => {},
	resetPreferences: () => {},
	...overrides,
})

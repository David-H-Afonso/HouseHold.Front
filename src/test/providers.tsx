import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { ProviderLinksContext } from '@/contexts/useProviderLinks'
import { UserPreferencesContext, type UserPreferencesContextValue } from '@/contexts/useUserPreferences'
import type { HouseholdProviderId } from '@/models/api/Integrations'
import { preferencesValue } from './preferences'

export const TestProviders = ({ children, preferences, links = {}, route = '/' }: { children: ReactNode; preferences?: UserPreferencesContextValue; links?: Partial<Record<HouseholdProviderId, string>>; route?: string }) => (
	<MemoryRouter initialEntries={[route]}>
		<UserPreferencesContext.Provider value={preferences ?? preferencesValue()}>
			<ProviderLinksContext.Provider value={{ links }}>{children}</ProviderLinksContext.Provider>
		</UserPreferencesContext.Provider>
	</MemoryRouter>
)

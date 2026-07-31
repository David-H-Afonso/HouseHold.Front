import { createContext, useContext } from 'react'
import type { HouseholdProviderId } from '@/models/api/Integrations'

export interface ProviderLinksContextValue {
	links: Partial<Record<HouseholdProviderId, string>>
}

export const ProviderLinksContext = createContext<ProviderLinksContextValue | null>(null)

export const useProviderLinks = () => {
	const value = useContext(ProviderLinksContext)
	if (!value) throw new Error('useProviderLinks must be used inside ProviderLinksProvider')
	return value
}

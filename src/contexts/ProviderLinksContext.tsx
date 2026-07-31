import { useEffect, useState, type ReactNode } from 'react'
import type { HouseholdProviderId } from '@/models/api/Integrations'
import { integrationService } from '@/services'
import { safeExternalUrl } from '@/utils'
import { ProviderLinksContext } from './useProviderLinks'

type ProviderLinks = Partial<Record<HouseholdProviderId, string>>

let connectionsRequest: ReturnType<typeof integrationService.connections> | null = null

const loadConnections = () => {
	connectionsRequest ??= integrationService.connections().catch((error) => {
		connectionsRequest = null
		throw error
	})
	return connectionsRequest
}

export const ProviderLinksProvider = ({ children }: { children: ReactNode }) => {
	const [links, setLinks] = useState<ProviderLinks>({})

	useEffect(() => {
		let active = true
		loadConnections()
			.then((connections) => {
				if (!active) return
				setLinks(connections.reduce<ProviderLinks>((result, connection) => {
					const url = safeExternalUrl(connection.openUrl)
					if (url) result[connection.provider] = url
					return result
				}, {}))
			})
			.catch(() => { /* Provider names remain readable when canonical links are unavailable. */ })
		return () => { active = false }
	}, [])

	return <ProviderLinksContext.Provider value={{ links }}>{children}</ProviderLinksContext.Provider>
}

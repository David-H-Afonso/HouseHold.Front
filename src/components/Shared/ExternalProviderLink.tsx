import type { ReactNode } from 'react'
import type { HouseholdProviderId } from '@/models/api/Integrations'
import { safeExternalUrl } from '@/utils'
import { useProviderLinks } from '@/contexts/useProviderLinks'
import { Icon } from './Icons'
import './ExternalProviderLink.scss'

interface ExternalProviderLinkProps {
	children: ReactNode
	provider?: HouseholdProviderId
	href?: string | null
	className?: string
}

export const ExternalProviderLink = ({ children, provider, href, className = '' }: ExternalProviderLinkProps) => {
	const { links } = useProviderLinks()
	const url = safeExternalUrl(href ?? (provider ? links[provider] : null))
	const classes = ['external-provider-link', className].filter(Boolean).join(' ')

	if (!url) return <span className={classes}>{children}</span>

	return <a className={classes} href={url} target='_blank' rel='noopener noreferrer'>
		<span>{children}</span>
		<Icon name='external' />
		<span className='sr-only'>, opens in a new tab</span>
	</a>
}

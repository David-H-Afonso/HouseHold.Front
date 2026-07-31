import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ExternalProviderLink } from './ExternalProviderLink'
import { ProviderLinksContext } from '@/contexts/useProviderLinks'

describe('ExternalProviderLink', () => {
	it('renders a safe canonical provider URL with explicit new-tab semantics', () => {
		render(<ProviderLinksContext.Provider value={{ links: { 'games-database': 'https://games.example.test/library' } }}>
			<ExternalProviderLink provider='games-database'>Games Database</ExternalProviderLink>
		</ProviderLinksContext.Provider>)

		const link = screen.getByRole('link', { name: /Games Database.*opens in a new tab/ })
		expect(link).toHaveAttribute('href', 'https://games.example.test/library')
		expect(link).toHaveAttribute('target', '_blank')
		expect(link).toHaveAttribute('rel', 'noopener noreferrer')
		expect(link.querySelector('svg')).toBeInTheDocument()
	})

	it('falls back to plain text for an unsafe or unavailable URL', () => {
		render(<ProviderLinksContext.Provider value={{ links: { doit: 'javascript:alert(1)' } }}>
			<ExternalProviderLink provider='doit'>DoIt</ExternalProviderLink>
		</ProviderLinksContext.Provider>)

		expect(screen.queryByRole('link')).not.toBeInTheDocument()
		expect(screen.getByText('DoIt')).toBeInTheDocument()
	})
})

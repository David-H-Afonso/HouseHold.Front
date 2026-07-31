import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { integrationService } from '@/services'
import { ProviderLinksProvider } from './ProviderLinksContext'
import { useProviderLinks } from './useProviderLinks'

const Probe = () => {
	const { links } = useProviderLinks()
	return <output aria-label='DoIt URL'>{links.doit ?? 'unavailable'}</output>
}

describe('ProviderLinksProvider', () => {
	afterEach(() => vi.restoreAllMocks())

	it('retries after a transient connection request failure', async () => {
		const connections = vi.spyOn(integrationService, 'connections')
			.mockRejectedValueOnce(new Error('temporary failure'))
			.mockResolvedValueOnce([{
				provider: 'doit',
				displayName: 'DoIt',
				configured: true,
				openUrl: 'https://doit.example.test',
				status: 'Connected',
				grantedScopes: [],
			}])

		const first = render(<ProviderLinksProvider><Probe /></ProviderLinksProvider>)
		await waitFor(() => expect(connections).toHaveBeenCalledTimes(1))
		expect(screen.getByRole('status', { name: 'DoIt URL' })).toHaveTextContent('unavailable')
		first.unmount()

		render(<ProviderLinksProvider><Probe /></ProviderLinksProvider>)
		await waitFor(() => expect(screen.getByRole('status', { name: 'DoIt URL' })).toHaveTextContent('https://doit.example.test/'))
		expect(connections).toHaveBeenCalledTimes(2)
	})
})

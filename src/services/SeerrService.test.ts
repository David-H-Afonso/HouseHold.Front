import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SeerrService } from './SeerrService'

const mocks = vi.hoisted(() => ({ customFetch: vi.fn() }))

vi.mock('@/utils/customFetch', () => ({ customFetch: mocks.customFetch }))

describe('SeerrService', () => {
	const service = new SeerrService()

	beforeEach(() => mocks.customFetch.mockResolvedValue(undefined))

	it('uses the Seerr BFF suffix for search and discovery', async () => {
		await service.search('Dune & spice', 3)
		await service.discover('upcoming-tv', 2)

		expect(mocks.customFetch).toHaveBeenNthCalledWith(1, '/v1/seerr/search', { params: { query: 'Dune & spice', page: 3 }, signal: undefined })
		expect(mocks.customFetch).toHaveBeenNthCalledWith(2, '/v1/seerr/discover', { params: { kind: 'upcoming-tv', page: 2 }, signal: undefined })
	})

	it('sends request mutations without constructing provider URLs', async () => {
		const body = { mediaType: 'tv' as const, mediaId: 42, is4k: true, seasons: [1, 2] }
		await service.createRequest(body)
		await service.moderateRequest(17, 'approve')
		await service.deleteRequest(17)

		expect(mocks.customFetch).toHaveBeenNthCalledWith(1, '/v1/seerr/requests', { method: 'POST', body })
		expect(mocks.customFetch).toHaveBeenNthCalledWith(2, '/v1/seerr/requests/17/approve', { method: 'POST' })
		expect(mocks.customFetch).toHaveBeenNthCalledWith(3, '/v1/seerr/requests/17', { method: 'DELETE' })
	})

	it('keeps admin configuration and mappings on their dedicated routes', async () => {
		await service.updateConfig({ internalUrl: 'http://seerr:5055', publicUrl: 'https://seerr.example.test' })
		await service.updateMapping('household user/id', { source: 'override', seerrUserId: 9 })
		await service.clearMapping('household user/id')

		expect(mocks.customFetch).toHaveBeenNthCalledWith(1, '/v1/seerr/config', { method: 'PUT', body: { internalUrl: 'http://seerr:5055', publicUrl: 'https://seerr.example.test' } })
		expect(mocks.customFetch).toHaveBeenNthCalledWith(2, '/v1/seerr/users/household%20user%2Fid/mapping', { method: 'PUT', body: { source: 'override', seerrUserId: 9 } })
		expect(mocks.customFetch).toHaveBeenNthCalledWith(3, '/v1/seerr/users/household%20user%2Fid/mapping', { method: 'DELETE' })
	})
})

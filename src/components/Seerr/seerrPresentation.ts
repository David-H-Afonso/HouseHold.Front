import { safeExternalUrl } from '@/utils'

const requestStatuses: Record<number, string> = {
	1: 'Pending',
	2: 'Approved',
	3: 'Declined',
	4: 'Failed',
	5: 'Completed',
}

const mediaStatuses: Record<number, string> = {
	1: 'Not requested',
	2: 'Pending',
	3: 'Processing',
	4: 'Partially available',
	5: 'Available',
	6: 'Blocklisted',
	7: 'Deleted',
}

export const requestStatusLabel = (status: number | null) => status === null ? 'No request' : requestStatuses[status] ?? `Request status ${status}`
export const mediaStatusLabel = (status: number | null) => status === null ? 'Unknown' : mediaStatuses[status] ?? `Media status ${status}`
export const statusClassName = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
export const qualityStatusBlocksRequest = (status: number | null) => status === 2 || status === 3 || status === 5

export const seerrImageSource = (path: string | null | undefined) => {
	const value = path?.trim()
	if (!value) return null
	if (value.startsWith('/modules/') || value.startsWith('/api/v1/')) return value
	return safeExternalUrl(value)
}

export const seasonLabel = (seasonNumber: number) => seasonNumber === 0 ? 'Specials' : `Season ${seasonNumber}`

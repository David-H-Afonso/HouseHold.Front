import { useEffect, useState } from 'react'

const labels: Record<string, string> = {
	household: 'H',
	doit: 'DO',
	games: 'GD',
	'games-database': 'GD',
	gamesdatabase: 'GD',
	jellywatch: 'JW',
	jellyfin: 'JF',
	'beast-vault': 'BV',
	beastvault: 'BV',
	pokemon: 'BV',
	'warcraft-archive': 'WA',
	warcraftarchive: 'WA',
	warcraft: 'WA',
	github: 'GH',
}

const localBrandImages: Record<string, string> = {
	household: '/household-mark.svg',
}

export const BrandMark = ({ provider, name, iconUrl, size = 'medium' }: { provider: string; name?: string; iconUrl?: string | null; size?: 'small' | 'medium' | 'large' }) => {
	const normalizedProvider = provider.toLowerCase()
	const localImage = localBrandImages[normalizedProvider]
	const [source, setSource] = useState(iconUrl || localImage)
	const [failed, setFailed] = useState(!source)
	useEffect(() => {
		setSource(iconUrl || localImage)
		setFailed(!(iconUrl || localImage))
	}, [iconUrl, localImage])
	const fallback = labels[normalizedProvider] ?? name?.trim().slice(0, 2).toUpperCase() ?? '?'
	const handleImageError = () => {
		if (source !== localImage && localImage) {
			setSource(localImage)
			return
		}
		setFailed(true)
	}
	return <span className={`brand-mark brand-mark--${provider} brand-mark--${size}`} aria-hidden='true'>
		{source && !failed ? <img src={source} alt='' width={52} height={52} decoding='async' onError={handleImageError} /> : <span>{fallback}</span>}
	</span>
}

import { useEffect, useState } from 'react'

const labels: Record<string, string> = {
	household: 'H',
	doit: 'DO',
	games: 'GD',
	'games-database': 'GD',
	jellywatch: 'JW',
	jellyfin: 'JF',
	'beast-vault': 'BV',
	pokemon: 'BV',
	'warcraft-archive': 'WA',
	warcraft: 'WA',
	github: 'GH',
}

const publicBrandImages: Record<string, string> = {
	household: '/household-mark.svg',
	doit: 'https://doit.davidhormigafonso.work/vite.svg',
	games: 'https://gamesdatabase.davidhormigafonso.work/favicon.ico',
	'games-database': 'https://gamesdatabase.davidhormigafonso.work/favicon.ico',
	gamesdatabase: 'https://gamesdatabase.davidhormigafonso.work/favicon.ico',
	jellywatch: 'https://jellywatch.davidhormigafonso.work/logo.png',
	jellyfin: 'https://jellyfin.davidhormigafonso.work/favicon.ico',
	'beast-vault': 'https://beastvault.davidhormigafonso.work/favicon.ico',
	beastvault: 'https://beastvault.davidhormigafonso.work/favicon.ico',
	warcraft: 'https://warcraftarchive.davidhormigafonso.work/favicon.ico',
	'warcraft-archive': 'https://warcraftarchive.davidhormigafonso.work/favicon.ico',
}

export const BrandMark = ({ provider, name, iconUrl, size = 'medium' }: { provider: string; name?: string; iconUrl?: string | null; size?: 'small' | 'medium' | 'large' }) => {
	const publicImage = publicBrandImages[provider] ?? publicBrandImages[provider.toLowerCase()]
	const [source, setSource] = useState(iconUrl || publicImage)
	const [failed, setFailed] = useState(!source)
	useEffect(() => {
		setSource(iconUrl || publicImage)
		setFailed(!(iconUrl || publicImage))
	}, [iconUrl, publicImage])
	const fallback = labels[provider] ?? name?.slice(0, 2).toUpperCase() ?? '?'
	const handleImageError = () => {
		if (source !== publicImage && publicImage) {
			setSource(publicImage)
			return
		}
		setFailed(true)
	}
	return <span className={`brand-mark brand-mark--${provider} brand-mark--${size}`} aria-hidden='true'>
		{source && !failed ? <img src={source} alt='' width={52} height={52} decoding='async' onError={handleImageError} /> : <span>{fallback}</span>}
	</span>
}

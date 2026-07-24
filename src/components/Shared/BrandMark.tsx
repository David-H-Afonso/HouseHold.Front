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

export const BrandMark = ({ provider, name, iconUrl, size = 'medium' }: { provider: string; name?: string; iconUrl?: string | null; size?: 'small' | 'medium' | 'large' }) => {
	const [failed, setFailed] = useState(false)
	useEffect(() => setFailed(false), [iconUrl])
	const fallback = labels[provider] ?? name?.slice(0, 2).toUpperCase() ?? '?'
	return <span className={`brand-mark brand-mark--${provider} brand-mark--${size}`} aria-hidden='true'>
		{iconUrl && !failed ? <img src={iconUrl} alt='' width={52} height={52} onError={() => setFailed(true)} /> : <span>{fallback}</span>}
	</span>
}

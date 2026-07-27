import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { FallbackImage, Icon, ModuleState } from '@/components/Shared'
import { useUserPreferences } from '@/contexts/useUserPreferences'
import type { PokemonSpriteSource } from '@/models/api/Preferences'
import type { PokemonModuleItem, PokemonModuleResponse, PokemonTagOption } from '@/models/api/Modules'
import { moduleService } from '@/services'
import { safeExternalUrl } from '@/utils'
import './PokemonPage.scss'

const TAKE = 24

const typeColors: Record<string, string> = {
	normal: '#a8a77a', fire: '#ee8130', water: '#6390f0', electric: '#f7d02c', grass: '#7ac74c',
	ice: '#96d9d6', fighting: '#c22e28', poison: '#a33ea1', ground: '#e2bf65', flying: '#a98ff3',
	psychic: '#f95587', bug: '#a6b91a', rock: '#b6a136', ghost: '#735797', dragon: '#6f35fc',
	dark: '#705746', steel: '#b7b7ce', fairy: '#d685ad',
}

const typeStyle = (type: string) => {
	const color = typeColors[type.toLowerCase()] ?? '#68a090'
	return { '--type-color': color, '--type-text': '#ffffff' } as CSSProperties
}

const PokemonCardShell = ({ item, children }: { item: PokemonModuleItem; children: ReactNode }) => {
	const url = safeExternalUrl(item.openUrl)
	return url ? <a href={url} target='_blank' rel='noopener noreferrer' className='pokemon-card'>{children}</a> : <article className='pokemon-card'>{children}</article>
}

export const PokemonPage = () => {
	const [search, setSearch] = useState('')
	const [query, setQuery] = useState('')
	const [selectedTags, setSelectedTags] = useState<number[]>([])
	const [skip, setSkip] = useState(0)
	const [data, setData] = useState<PokemonModuleResponse | null>(null)
	const [tags, setTags] = useState<PokemonTagOption[]>([])
	const [loading, setLoading] = useState(true)
	const [listFailed, setListFailed] = useState(false)
	const [tagsFailed, setTagsFailed] = useState(false)
	const [downloading, setDownloading] = useState<number | null>(null)
	const [downloadError, setDownloadError] = useState<string | null>(null)
	const { preferences, updatePreferences } = useUserPreferences()

	useEffect(() => {
		const handle = window.setTimeout(() => {
			setSkip(0)
			setQuery(search.trim())
		}, 300)
		return () => window.clearTimeout(handle)
	}, [search])

	useEffect(() => {
		let active = true
		moduleService.pokemonTags()
			.then((response) => { if (active) setTags(response) })
			.catch(() => { if (active) setTagsFailed(true) })
		return () => { active = false }
	}, [])

	useEffect(() => {
		let active = true
		setLoading(true)
		setListFailed(false)
		moduleService.pokemon({ search: query, tagIds: selectedTags, skip, take: TAKE, spriteSource: preferences.pokemonSpriteSource })
			.then((response) => { if (active) setData(response) })
			.catch(() => { if (active) setListFailed(true) })
			.finally(() => { if (active) setLoading(false) })
		return () => { active = false }
	}, [query, selectedTags, skip, preferences.pokemonSpriteSource])

	const page = data ? Math.floor(data.skip / data.take) + 1 : 1
	const pages = data ? Math.max(1, Math.ceil(data.total / data.take)) : 1
	const categories = useMemo(() => [...new Set(tags.map((tag) => tag.category).filter(Boolean))], [tags])
	const failed = listFailed || tagsFailed

	const toggleTag = (id: number) => {
		setSkip(0)
		setSelectedTags((current) => current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id])
	}

	const download = async (event: MouseEvent, item: PokemonModuleItem) => {
		event.preventDefault(); event.stopPropagation(); if (downloading !== null) return
		setDownloading(item.id); setDownloadError(null)
		try { const download = await moduleService.downloadPokemon(item.id); const url = URL.createObjectURL(download.blob); const link = document.createElement('a'); link.href = url; const fallbackName = `${(item.nickname || item.speciesName).replace(/[^a-z0-9_-]+/gi, '-')}.pkm`; link.download = download.fileName || fallbackName; link.click(); URL.revokeObjectURL(url) }
		catch { setDownloadError(`Download is not configured for ${item.nickname || item.speciesName}.`) }
		finally { setDownloading(null) }
	}

	return (
		<div className='pokemon-page'>
			<header className='pokemon-page__header'>
				<div><span>Beast Vault</span><h1>Pokémon collection</h1><p>Browse companions by species, nickname or tags.</p></div>
				{data && <strong>{data.total}<span>Pokémon</span></strong>}
			</header>

			<section className='pokemon-filters' aria-label='Collection filters'>
				<label className='pokemon-sprite-source'><span>Sprite source</span><select value={preferences.pokemonSpriteSource} onChange={(event) => updatePreferences({ pokemonSpriteSource: event.target.value as PokemonSpriteSource })}><option value='home'>HOME</option><option value='artwork'>Artwork</option><option value='default'>Default</option><option value='showdown'>Showdown</option><option value='github'>GitHub</option></select></label>
				<label className='pokemon-search'>
					<span className='sr-only'>Search Pokémon</span>
					<svg viewBox='0 0 24 24' aria-hidden='true'><circle cx='11' cy='11' r='7' /><path d='m20 20-4-4' /></svg>
					<input name='pokemonSearch' value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Search species or nickname…' autoComplete='off' />
					{search && <button type='button' onClick={() => setSearch('')} aria-label='Clear search'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='m6 6 12 12M18 6 6 18' /></svg></button>}
				</label>
				{tags.length > 0 && <div className='pokemon-tag-filter'>
					<div className='pokemon-tag-filter__heading'><span>Tags</span>{categories.length > 0 && <small>{categories.length} groups</small>}{selectedTags.length > 0 && <button type='button' onClick={() => { setSelectedTags([]); setSkip(0) }}>Clear</button>}</div>
					<div className='pokemon-tag-filter__list'>
							{tags.map((tag) => <button key={tag.id} type='button' aria-pressed={selectedTags.includes(tag.id)} onClick={() => toggleTag(tag.id)} style={{ '--tag-color': tag.colorHex || '#68d5c4' } as CSSProperties}>
							{tag.imageUrl && <FallbackImage src={tag.imageUrl} alt='' width={20} height={20} />}<span>{tag.name}</span><strong>{tag.pokemonCount}</strong>
						</button>)}
					</div>
				</div>}
			</section>
			{downloadError && <p className='pokemon-download-error' role='alert'>{downloadError}</p>}

			{loading && !data && <ModuleState kind='loading' title='Opening the vault'>Loading your Pokémon collection.</ModuleState>}
			{failed && <ModuleState kind='error' title='Beast Vault is not available'>Connect or review the Beast Vault provider to browse your collection.</ModuleState>}
			{!loading && !failed && data?.items.length === 0 && <ModuleState kind='empty' title='No Pokémon found'>Try another search or remove one of the selected tags.</ModuleState>}

			{data && data.items.length > 0 && !failed && <>
				<div className={`pokemon-grid${loading ? ' is-loading' : ''}`} aria-busy={loading}>
					{data.items.map((item) => <PokemonCardShell key={item.id} item={item}>
						<div className='pokemon-card__badges'><span>Lv. {item.level}</span><span>#{String(item.speciesId).padStart(3, '0')}</span></div>
						<div className='pokemon-card__flags'>{item.favorite && <span title='Favorite'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z' /></svg><span className='sr-only'>Favorite</span></span>}{item.isShiny && <b>Shiny</b>}{item.isEgg && <b>Egg</b>}</div>
						<button className='pokemon-card__download' type='button' onClick={(event) => download(event, item)} disabled={downloading !== null} aria-label={`Download ${item.nickname || item.speciesName}`}><Icon name='download' />{downloading === item.id && <span className='sr-only'>Downloading</span>}</button>
						<div className='pokemon-card__sprite'><FallbackImage src={item.spriteUrl} fallbackSrc={item.fallbackSpriteUrl} alt={item.nickname || item.speciesName} fallbackLabel={item.speciesName} loading='lazy' /></div>
						<div className='pokemon-card__identity'><h2>{item.nickname || item.speciesName}</h2>{item.nickname && <p>{item.speciesName}</p>}</div>
						<div className='pokemon-card__types'>{[item.type1, item.type2].filter((type): type is string => Boolean(type)).map((type) => <span key={type} style={typeStyle(type)}>{type}</span>)}</div>
						{item.tags.length > 0 && <div className='pokemon-card__tags'>{item.tags.slice(0, 4).map((tag) => <span key={tag.id} style={{ '--tag-color': tag.colorHex || '#68d5c4' } as CSSProperties}>{tag.imageUrl && <FallbackImage src={tag.imageUrl} alt='' width={16} height={16} />}{tag.name}</span>)}{item.tags.length > 4 && <span>+{item.tags.length - 4}</span>}</div>}
					</PokemonCardShell>)}
				</div>
				<nav className='pokemon-pagination' aria-label='Collection pages'>
					<button type='button' disabled={page <= 1 || loading} onClick={() => setSkip(Math.max(0, skip - TAKE))}>Previous</button>
					<span>Page <strong>{page}</strong> of {pages}</span>
					<button type='button' disabled={page >= pages || loading} onClick={() => setSkip(skip + TAKE)}>Next</button>
				</nav>
			</>}
		</div>
	)
}

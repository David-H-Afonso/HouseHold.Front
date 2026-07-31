import { useEffect, useMemo, useState } from 'react'
import { AppCategoryTabs, AppLauncherCard } from '@/components/Apps'
import { ModuleHeader, SearchBar } from '@/components/Shared'
import type { AppLauncherCategory, AppLauncherItem } from '@/models/api/Apps'
import { appCatalogService } from '@/services/AppCatalogService'
import { useAppSelector } from '@/store/hooks'
import { selectIsAdmin } from '@/store/features/auth/selector'

export const AppsPage = () => {
	const isAdmin = useAppSelector(selectIsAdmin)
	const [apps, setApps] = useState<AppLauncherItem[]>([])
	const [categories, setCategories] = useState<AppLauncherCategory[]>([])
	const [activeCategory, setActiveCategory] = useState('All')
	const [search, setSearch] = useState('')
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let mounted = true
		appCatalogService.list()
			.then((appItems) => {
				if (!mounted) return
				setApps(appItems)
				setCategories([...appItems.reduce((result, app) => result.set(app.category, (result.get(app.category) ?? 0) + 1), new Map<string, number>())]
					.map(([name, count]) => ({ name, count }))
					.sort((left, right) => left.name.localeCompare(right.name)))
			})
			.catch(() => {
				if (mounted) setError('Applications could not be loaded. Try again.')
			})
			.finally(() => {
				if (mounted) setLoading(false)
			})

		return () => {
			mounted = false
		}
	}, [])

	const visibleApps = useMemo(() => {
		const term = search.trim().toLowerCase()
		return apps.filter((app) => {
			const matchesCategory =
				activeCategory === 'All' ||
				(activeCategory === 'Favorites' && app.favorite) ||
				app.category === activeCategory
			const matchesSearch =
				!term ||
				app.name.toLowerCase().includes(term) ||
				app.category.toLowerCase().includes(term) ||
				(app.description?.toLowerCase().includes(term) ?? false)

			return matchesCategory && matchesSearch
		})
	}, [activeCategory, apps, search])

	const toggleFavorite = async (app: AppLauncherItem) => {
		const previous = apps
		const nextFavorite = !app.favorite
		setApps((current) =>
			current.map((item) => (item.id === app.id ? { ...item, favorite: nextFavorite } : item))
		)

		try {
			const updated = await appCatalogService.setFavorite(app.id, nextFavorite)
			setApps((current) => current.map((item) => (item.id === updated.id ? updated : item)))
		} catch {
			setApps(previous)
			setError('Favorite update failed. Try again.')
		}
	}

	return (
		<div className='page-stack'>
			<ModuleHeader title='Apps' />

			<section className='apps-toolbar'>
				<SearchBar value={search} placeholder='Search apps' onChange={setSearch} />
				<AppCategoryTabs categories={categories} value={activeCategory} onChange={setActiveCategory} />
			</section>

			{loading && <p className='muted'>Loading apps...</p>}
			{error && <p className='error-text'>{error}</p>}
			{!loading && !error && apps.length === 0 && (
				<section className='empty-panel'>
					<h2>No app launcher config found</h2>
					<p>Mount an app launcher JSON file and set APP_LAUNCHER_CONFIG_PATH in Household.Api.</p>
				</section>
			)}
			{!loading && apps.length > 0 && visibleApps.length === 0 && (
				<section className='empty-panel'>
					<h2>No matching apps</h2>
					<p>Try another category or search term.</p>
				</section>
			)}

			<div className='apps-grid'>
				{visibleApps.map((app) => (
					<AppLauncherCard key={app.id} app={app} isAdmin={isAdmin} onToggleFavorite={toggleFavorite} />
				))}
			</div>
		</div>
	)
}

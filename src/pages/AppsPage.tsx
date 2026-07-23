import { useEffect, useMemo, useState } from 'react'
import { AppCategoryTabs, AppLauncherCard } from '@/components/Apps'
import { ModuleHeader, SearchBar } from '@/components/Shared'
import type { AppLauncherCategory, AppLauncherItem } from '@/models/api/Apps'
import { appCatalogService } from '@/services'

export const AppsPage = () => {
	const [apps, setApps] = useState<AppLauncherItem[]>([])
	const [categories, setCategories] = useState<AppLauncherCategory[]>([])
	const [activeCategory, setActiveCategory] = useState('All')
	const [search, setSearch] = useState('')
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let mounted = true
		Promise.all([appCatalogService.list(), appCatalogService.categories()])
			.then(([appItems, categoryItems]) => {
				if (!mounted) return
				setApps(appItems)
				setCategories(categoryItems)
			})
			.catch((err: Error) => {
				if (mounted) setError(err.message)
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
		} catch (err) {
			setApps(previous)
			setError(err instanceof Error ? err.message : 'Favorite update failed.')
		}
	}

	return (
		<div className='page-stack'>
			<ModuleHeader
				title='Apps'
				description='Open Household services from one configurable launcher. Docker status and admin actions stay disabled until later phases.'
			/>

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
					<AppLauncherCard key={app.id} app={app} onToggleFavorite={toggleFavorite} />
				))}
			</div>
		</div>
	)
}

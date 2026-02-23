import { useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { selectIsAdmin } from '@/store/features/auth'
import { AuthSection } from '../sections/AuthSection'
import { AdminSection } from '../sections/AdminSection'
import { FoodItemsSection } from '../sections/FoodItemsSection'
import { DishTemplatesSection } from '../sections/DishTemplatesSection'
import { MealEntriesSection } from '../sections/MealEntriesSection'
import { HomeSection } from '../sections/HomeSection'

type Tab = 'auth' | 'admin' | 'food' | 'dish' | 'meals' | 'home'

const ALL_TABS: { id: Tab; label: string; adminOnly?: boolean }[] = [
	{ id: 'auth', label: 'A) Auth' },
	{ id: 'admin', label: 'B) Admin', adminOnly: true },
	{ id: 'food', label: 'C) Food Items' },
	{ id: 'dish', label: 'D) Dish Templates' },
	{ id: 'meals', label: 'E) Meal Entries' },
	{ id: 'home', label: 'F) Home' },
]

const Playground = () => {
	const isAdmin = useAppSelector(selectIsAdmin)
	const [activeTab, setActiveTab] = useState<Tab>('auth')

	const visibleTabs = ALL_TABS.filter((t) => !t.adminOnly || isAdmin)

	return (
		<div className='playground'>
			<nav className='playground__tabs' role='tablist'>
				{visibleTabs.map((t) => (
					<button
						key={t.id}
						role='tab'
						aria-selected={activeTab === t.id}
						className={`playground__tab${activeTab === t.id ? ' playground__tab--active' : ''}`}
						onClick={() => setActiveTab(t.id)}>
						{t.label}
					</button>
				))}
			</nav>

			<div className='playground__content'>
				{activeTab === 'auth' && <AuthSection />}
				{activeTab === 'admin' && isAdmin && <AdminSection />}
				{activeTab === 'food' && <FoodItemsSection />}
				{activeTab === 'dish' && <DishTemplatesSection />}
				{activeTab === 'meals' && <MealEntriesSection />}
				{activeTab === 'home' && <HomeSection />}
			</div>
		</div>
	)
}

export default Playground

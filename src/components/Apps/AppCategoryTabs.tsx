import { FilterTabs } from '@/components/Shared'
import type { AppLauncherCategory } from '@/models/api/Apps'

interface AppCategoryTabsProps {
	categories: AppLauncherCategory[]
	value: string
	onChange: (value: string) => void
}

export const AppCategoryTabs = ({ categories, value, onChange }: AppCategoryTabsProps) => {
	const options = ['All', 'Favorites', ...categories.map((category) => category.name)]

	return <FilterTabs options={options} value={value} onChange={onChange} />
}

import { ModuleHeader } from '@/components/Shared'

interface PlaceholderModulePageProps {
	title: string
	description: string
}

export const PlaceholderModulePage = ({ title, description }: PlaceholderModulePageProps) => {
	return (
		<div className='page-stack'>
			<ModuleHeader title={title} description={description} />
			<section className='empty-panel'>
				<h2>Planned module</h2>
				<p>This route exists now so the Household shell is stable. Feature work lands in its assigned phase.</p>
			</section>
		</div>
	)
}

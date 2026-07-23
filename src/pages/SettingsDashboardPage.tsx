import { ModuleHeader } from '@/components/Shared'

export const SettingsDashboardPage = () => {
	return (
		<div className='page-stack'>
			<ModuleHeader
				title='Dashboard settings'
				description='Widget order, visibility and refresh intervals are reserved for the personalization phase.'
			/>
			<section className='empty-panel'>
				<h2>Widget settings</h2>
				<p>Dashboard customization is planned for Phase 11. This placeholder keeps the route and shell contract stable.</p>
			</section>
		</div>
	)
}

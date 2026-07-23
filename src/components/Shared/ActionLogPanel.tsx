export interface ActionLogItem {
	id: string
	action: string
	status: string
	startedAt: string
	errorMessage?: string | null
}

interface ActionLogPanelProps {
	items: ActionLogItem[]
}

export const ActionLogPanel = ({ items }: ActionLogPanelProps) => {
	return (
		<section className='action-log-panel'>
			<h2>Action log</h2>
			{items.length === 0 ? (
				<p>No actions recorded yet.</p>
			) : (
				<ul>
					{items.map((item) => (
						<li key={item.id}>
							<strong>{item.action}</strong>
							<span>{item.status}</span>
							<time>{new Date(item.startedAt).toLocaleString()}</time>
						</li>
					))}
				</ul>
			)}
		</section>
	)
}

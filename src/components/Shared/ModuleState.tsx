import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './ModuleState.scss'

interface ModuleStateProps {
	kind: 'loading' | 'empty' | 'error'
	title: string
	children: ReactNode
}

export const ModuleState = ({ kind, title, children }: ModuleStateProps) => (
	<section className={`module-state module-state--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
		<div className='module-state__mark' aria-hidden='true'>
			{kind === 'loading' ? <span className='module-state__spinner' /> : kind === 'empty' ? '0' : '!'}
		</div>
		<div>
			<h2>{title}</h2>
			<p>{children}</p>
			{kind === 'error' && (
				<Link to='/settings/integrations'>Check integration settings</Link>
			)}
		</div>
	</section>
)

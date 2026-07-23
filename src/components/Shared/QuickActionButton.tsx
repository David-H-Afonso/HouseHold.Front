import type { ButtonHTMLAttributes } from 'react'

export const QuickActionButton = ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => {
	return (
		<button type='button' className='quick-action-button' {...props}>
			{children}
		</button>
	)
}

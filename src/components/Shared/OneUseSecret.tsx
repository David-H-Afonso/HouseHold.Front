import { useState } from 'react'

export const OneUseSecret = ({ title, value, detail, onDismiss }: { title: string; value: string; detail: string; onDismiss: () => void }) => {
	const [copied, setCopied] = useState(false)
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(value)
			setCopied(true)
		} catch {
			setCopied(false)
		}
	}
	return <aside className='one-use-secret' aria-labelledby='one-use-secret-title'>
		<div><strong id='one-use-secret-title'>{title}</strong><p>{detail}</p></div>
		<code>{value}</code>
		<div className='one-use-secret__actions'>
			<button type='button' onClick={() => void copy()}>{copied ? 'Copied' : 'Copy'}</button>
			<button type='button' onClick={onDismiss}>Dismiss</button>
		</div>
		<span className='sr-only' role='status' aria-live='polite'>{copied ? 'Copied to clipboard.' : ''}</span>
	</aside>
}

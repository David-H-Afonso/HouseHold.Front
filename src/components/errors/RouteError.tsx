import { useRouteError } from 'react-router-dom'

export const RouteError = () => {
	const error = useRouteError() as any
	return (
		<div style={{ padding: '2rem', textAlign: 'center' }}>
			<h1>500</h1>
			<p>Something went wrong.</p>
			{error?.message && (
				<pre style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#aaa' }}>{error.message}</pre>
			)}
			<a href='/'>← Back home</a>
		</div>
	)
}

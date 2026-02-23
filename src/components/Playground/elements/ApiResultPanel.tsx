import type { ApiCallState } from '@/hooks/useApiCall'

interface ApiResultPanelProps {
	state: ApiCallState<any>
	label?: string
}

/**
 * Shared panel to display request payload + status + JSON response for all Playground sections.
 */
export const ApiResultPanel = ({ state, label = 'Result' }: ApiResultPanelProps) => {
	if (!state.loading && state.data === null && state.error === null && state.status === null) {
		return null
	}

	return (
		<div className='api-result'>
			<div className='api-result__header'>
				<span className='api-result__label'>{label}</span>
				{state.status !== null && (
					<span
						className={`api-result__status ${state.status >= 400 ? 'api-result__status--error' : 'api-result__status--ok'}`}>
						{state.status}
					</span>
				)}
				{state.loading && <span className='api-result__loading'>⏳ Loading…</span>}
			</div>

			{state.requestPayload !== null && (
				<div className='api-result__block'>
					<p className='api-result__block-title'>Request payload</p>
					<pre className='api-result__json'>{JSON.stringify(state.requestPayload, null, 2)}</pre>
				</div>
			)}

			{state.data !== null && (
				<div className='api-result__block'>
					<p className='api-result__block-title'>Response</p>
					<pre className='api-result__json api-result__json--ok'>
						{JSON.stringify(state.data, null, 2)}
					</pre>
				</div>
			)}

			{state.error !== null && (
				<div className='api-result__block'>
					<p className='api-result__block-title'>Error</p>
					<pre className='api-result__json api-result__json--error'>{state.error}</pre>
				</div>
			)}
		</div>
	)
}

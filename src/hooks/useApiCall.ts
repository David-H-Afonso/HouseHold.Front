import { useState, useCallback } from 'react'

export interface ApiCallState<T> {
	loading: boolean
	status: number | null
	data: T | null
	error: string | null
	requestPayload: unknown | null
}

export interface ApiCallActions<T> {
	call: (fn: () => Promise<T>, payload?: unknown) => Promise<T | null>
	reset: () => void
}

const initialState = <T>(): ApiCallState<T> => ({
	loading: false,
	status: null,
	data: null,
	error: null,
	requestPayload: null,
})

/**
 * Generic hook for executing an async API call and tracking its state.
 * Used uniformly across all Playground sections.
 */
export function useApiCall<T = any>(): [ApiCallState<T>, ApiCallActions<T>] {
	const [state, setState] = useState<ApiCallState<T>>(initialState<T>())

	const call = useCallback(async (fn: () => Promise<T>, payload?: unknown): Promise<T | null> => {
		setState({
			loading: true,
			status: null,
			data: null,
			error: null,
			requestPayload: payload ?? null,
		})
		try {
			const result = await fn()
			setState({
				loading: false,
				status: 200,
				data: result,
				error: null,
				requestPayload: payload ?? null,
			})
			return result
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err)
			// Try to extract status code from message: "HTTP 4xx: ..."
			const statusMatch = msg.match(/HTTP (\d{3})/)
			const status = statusMatch ? parseInt(statusMatch[1], 10) : 0
			setState({ loading: false, status, data: null, error: msg, requestPayload: payload ?? null })
			return null
		}
	}, [])

	const reset = useCallback(() => setState(initialState<T>()), [])

	return [state, { call, reset }]
}

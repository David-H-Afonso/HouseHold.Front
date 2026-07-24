import { useCallback, useEffect, useRef, useState } from 'react'
import type { TodayModuleResponse, TodayTask } from '@/models/api/Modules'
import { moduleService } from '@/services'
import { isApiError } from '@/utils/customFetch'

const POLL_INTERVAL_MS = 20_000

const normalizeStatus = (value: string) => value.replace(/[\s_-]/g, '').toLowerCase()

const progressKey = (status: string): 'pending' | 'done' | 'missed' | 'notApplicable' | null => {
	const normalized = normalizeStatus(status)
	if (normalized === 'pending') return 'pending'
	if (normalized === 'done' || normalized === 'completed') return 'done'
	if (normalized === 'missed') return 'missed'
	if (normalized === 'notapplicable') return 'notApplicable'
	return null
}

const applyOptimisticStatus = (data: TodayModuleResponse, occurrenceId: string, occurrenceStatus: string) => {
	const task = data.tasks.find((item) => item.occurrenceId === occurrenceId)
	if (!task || task.occurrenceStatus === occurrenceStatus) return data
	const previousKey = progressKey(task.occurrenceStatus)
	const nextKey = progressKey(occurrenceStatus)
	const progress = { ...data.progress }
	if (previousKey) progress[previousKey] = Math.max(0, progress[previousKey] - 1)
	if (nextKey) progress[nextKey] += 1
	return {
		...data,
		progress,
		tasks: data.tasks.map((item) => item.occurrenceId === occurrenceId ? { ...item, occurrenceStatus } : item),
	}
}

export const useTodayModule = (date: string, timeZoneId?: string, poll = true) => {
	const [data, setData] = useState<TodayModuleResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [providerError, setProviderError] = useState(false)
	const [actionError, setActionError] = useState<string | null>(null)
	const [pendingOccurrences, setPendingOccurrences] = useState<Set<string>>(() => new Set())
	const pendingOccurrencesRef = useRef(new Set<string>())
	const mountedRef = useRef(true)
	const requestIdRef = useRef(0)

	useEffect(() => {
		mountedRef.current = true
		return () => {
			mountedRef.current = false
		}
	}, [])

	const refetch = useCallback(async (showLoading = false) => {
		const requestId = ++requestIdRef.current
		if (showLoading) setLoading(true)
		try {
			const response = await moduleService.today(date, timeZoneId)
			if (mountedRef.current && requestId === requestIdRef.current) {
				setData(response)
				setProviderError(false)
			}
			return response
		} catch {
			if (mountedRef.current && requestId === requestIdRef.current) setProviderError(true)
			return null
		} finally {
			if (mountedRef.current && requestId === requestIdRef.current) setLoading(false)
		}
	}, [date, timeZoneId])

	useEffect(() => {
		void refetch(true)
	}, [refetch])

	useEffect(() => {
		if (!poll) return
		const refreshIfVisible = () => {
			if (document.visibilityState === 'visible') void refetch(false)
		}
		const interval = window.setInterval(refreshIfVisible, POLL_INTERVAL_MS)
		const onVisibilityChange = () => {
			if (document.visibilityState === 'visible') void refetch(false)
		}
		window.addEventListener('focus', refreshIfVisible)
		document.addEventListener('visibilitychange', onVisibilityChange)
		return () => {
			window.clearInterval(interval)
			window.removeEventListener('focus', refreshIfVisible)
			document.removeEventListener('visibilitychange', onVisibilityChange)
		}
	}, [poll, refetch])

	const runAction = useCallback(async (task: TodayTask, action: 'complete' | 'undo') => {
		if (pendingOccurrencesRef.current.has(task.occurrenceId)) return
		const previousStatus = task.occurrenceStatus
		const optimisticStatus = action === 'complete' ? 'Done' : 'Pending'
		setActionError(null)
		pendingOccurrencesRef.current.add(task.occurrenceId)
		setPendingOccurrences((current) => new Set(current).add(task.occurrenceId))
		setData((current) => current ? applyOptimisticStatus(current, task.occurrenceId, optimisticStatus) : current)
		try {
			if (action === 'complete') await moduleService.completeTodayOccurrence(task.occurrenceId)
			else await moduleService.undoTodayOccurrence(task.occurrenceId)
			await refetch(false)
		} catch (reason) {
			if (mountedRef.current) {
				const canonical = isApiError(reason) && reason.reconcilable ? await refetch(false) : null
				const confirmed = canonical?.tasks.find((item) => item.occurrenceId === task.occurrenceId)?.occurrenceStatus === optimisticStatus
				if (!confirmed && !canonical) setData((current) => current ? applyOptimisticStatus(current, task.occurrenceId, previousStatus) : current)
				if (!confirmed) setActionError(canonical ? 'DoIt did not confirm this action. Its canonical value was restored.' : action === 'complete' ? 'Could not complete this task. Try again.' : 'Could not undo this task. Try again.')
			}
		} finally {
			pendingOccurrencesRef.current.delete(task.occurrenceId)
			if (mountedRef.current) {
				setPendingOccurrences((current) => {
					const next = new Set(current)
					next.delete(task.occurrenceId)
					return next
				})
			}
		}
	}, [refetch])

	return { data, loading, providerError, actionError, pendingOccurrences, refetch, runAction }
}

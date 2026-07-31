import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useAppSelector } from '@/store/hooks'
import { selectCurrentUser } from '@/store/features/auth/selector'
import { createDefaultPreferences } from '@/models/api/Preferences'
import { preferencesService, type PreferencePersistence } from '@/services/PreferencesService'
import { UserPreferencesContext } from './useUserPreferences'
import type { UserPreferences } from '@/models/api/Preferences'

type PreferenceUpdate = Partial<UserPreferences> | ((current: UserPreferences) => UserPreferences)

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
	const user = useAppSelector(selectCurrentUser)
	const userId = user?.userId ?? 'anonymous'
	const [preferences, setPreferences] = useState(createDefaultPreferences)
	const [ready, setReady] = useState(false)
	const [saving, setSaving] = useState(false)
	const [persistence, setPersistence] = useState<PreferencePersistence>('device')
	const preferencesRef = useRef(preferences)
	const saveQueueRef = useRef<Promise<void>>(Promise.resolve())
	const pendingSavesRef = useRef(0)
	const generationRef = useRef(0)
	const resetPendingRef = useRef(false)

	useEffect(() => {
		let active = true
		const generation = ++generationRef.current
		saveQueueRef.current = Promise.resolve()
		pendingSavesRef.current = 0
		resetPendingRef.current = false
		setSaving(false)
		setReady(false)
		preferencesService.load(userId).then((result) => {
			if (!active || generation !== generationRef.current) return
			preferencesRef.current = result.preferences
			setPreferences(result.preferences)
			setPersistence(result.persistence)
			setReady(true)
		})
		return () => { active = false }
	}, [userId])

	useEffect(() => {
		const theme = preferences.visualPreference
		document.documentElement.dataset.theme = theme
		document.documentElement.style.colorScheme = theme === 'system' ? 'light dark' : theme
		try { localStorage.setItem('household:theme', theme) } catch { /* Theme remains applied for this session. */ }
		const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
		if (themeColor) themeColor.content = theme === 'dark' ? '#0b1220' : theme === 'light' ? '#f5f6f8' : (window.matchMedia('(prefers-color-scheme: dark)').matches ? '#0b1220' : '#f5f6f8')
	}, [preferences.visualPreference])

	const persist = async (next: UserPreferences) => {
		preferencesRef.current = next
		setPreferences(next)
		const generation = generationRef.current
		pendingSavesRef.current += 1
		setSaving(true)
		const save = saveQueueRef.current
			.catch(() => { /* A failed write must not block the latest preference. */ })
			.then(() => preferencesService.save(userId, next))
			.then((result) => { if (generation === generationRef.current) setPersistence(result) })
			.finally(() => {
				if (generation !== generationRef.current) return
				pendingSavesRef.current -= 1
				if (pendingSavesRef.current === 0) setSaving(false)
			})
		saveQueueRef.current = save
		await save
	}

	const deferPersistUntilReset = (update: PreferenceUpdate) => {
		const generation = generationRef.current
		pendingSavesRef.current += 1
		setSaving(true)
		const save = saveQueueRef.current
			.catch(() => { /* A failed reset must not block the queued edit. */ })
			.then(async () => {
				if (generation !== generationRef.current) return
				const current = preferencesRef.current
				const next = typeof update === 'function' ? update(current) : { ...current, ...update }
				preferencesRef.current = next
				setPreferences(next)
				const result = await preferencesService.save(userId, next)
				if (generation === generationRef.current) setPersistence(result)
			})
			.finally(() => {
				if (generation !== generationRef.current) return
				pendingSavesRef.current -= 1
				if (pendingSavesRef.current === 0) setSaving(false)
			})
		saveQueueRef.current = save
		return save
	}

	const updatePreferences = (update: PreferenceUpdate) => {
		if (resetPendingRef.current) return deferPersistUntilReset(update)
		const current = preferencesRef.current
		const next = typeof update === 'function' ? update(current) : { ...current, ...update }
		return persist(next)
	}

	const resetPreferences = () => {
		if (resetPendingRef.current) return
		resetPendingRef.current = true
		const generation = generationRef.current
		pendingSavesRef.current += 1
		setSaving(true)
		const reset = saveQueueRef.current
			.catch(() => { /* Reset still runs after a failed queued write. */ })
			.then(() => preferencesService.reset(userId))
			.then((result) => {
				if (generation !== generationRef.current) return
				preferencesRef.current = result.preferences
				setPreferences(result.preferences)
				setPersistence(result.persistence)
			})
			.finally(() => {
				if (generation !== generationRef.current) return
				resetPendingRef.current = false
				pendingSavesRef.current -= 1
				if (pendingSavesRef.current === 0) setSaving(false)
			})
		saveQueueRef.current = reset
	}

	return (
		<UserPreferencesContext.Provider value={{ preferences, ready, saving, persistence, updatePreferences, resetPreferences }}>
			{ready ? children : <div className='preference-loading' role='status'>Loading your preferences…</div>}
		</UserPreferencesContext.Provider>
	)
}

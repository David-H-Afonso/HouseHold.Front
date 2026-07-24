import { useEffect, useState, type ReactNode } from 'react'
import { useAppSelector } from '@/store/hooks'
import { selectCurrentUser } from '@/store/features/auth/selector'
import { createDefaultPreferences } from '@/models/api/Preferences'
import { preferencesService, type PreferencePersistence } from '@/services/PreferencesService'
import { UserPreferencesContext } from './useUserPreferences'
import type { UserPreferences } from '@/models/api/Preferences'

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
	const user = useAppSelector(selectCurrentUser)
	const userId = user?.userId ?? 'anonymous'
	const [preferences, setPreferences] = useState(createDefaultPreferences)
	const [ready, setReady] = useState(false)
	const [saving, setSaving] = useState(false)
	const [persistence, setPersistence] = useState<PreferencePersistence>('device')

	useEffect(() => {
		let active = true
		setReady(false)
		preferencesService.load(userId).then((result) => {
			if (!active) return
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
		setPreferences(next)
		setSaving(true)
		try {
			setPersistence(await preferencesService.save(userId, next))
		} finally {
			setSaving(false)
		}
	}

	const updatePreferences = (update: Partial<UserPreferences> | ((current: UserPreferences) => UserPreferences)) => {
		const next = typeof update === 'function' ? update(preferences) : { ...preferences, ...update }
		return persist(next)
	}

	const resetPreferences = () => {
		setSaving(true)
		preferencesService.reset(userId)
			.then((result) => {
				setPreferences(result.preferences)
				setPersistence(result.persistence)
			})
			.finally(() => setSaving(false))
	}

	return (
		<UserPreferencesContext.Provider value={{ preferences, ready, saving, persistence, updatePreferences, resetPreferences }}>
			{ready ? children : <div className='preference-loading' role='status'>Loading your preferences…</div>}
		</UserPreferencesContext.Provider>
	)
}

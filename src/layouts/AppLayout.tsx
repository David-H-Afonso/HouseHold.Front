import React from 'react'
import { AppShell } from '@/components/Shell'
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext'

interface AppLayoutProps {
	children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
	return <UserPreferencesProvider><AppShell>{children}</AppShell></UserPreferencesProvider>
}

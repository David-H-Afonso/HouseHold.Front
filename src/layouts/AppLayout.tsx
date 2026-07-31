import React from 'react'
import { AppShell } from '@/components/Shell'
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext'
import { ProviderLinksProvider } from '@/contexts/ProviderLinksContext'

interface AppLayoutProps {
	children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
	return <UserPreferencesProvider><ProviderLinksProvider><AppShell>{children}</AppShell></ProviderLinksProvider></UserPreferencesProvider>
}

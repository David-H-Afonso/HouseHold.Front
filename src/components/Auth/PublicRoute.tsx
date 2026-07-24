import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectIsAuthenticated, selectRequiresPasswordChange } from '@/store/features/auth/selector'

interface PublicRouteProps {
	children: ReactNode
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
	const isAuthenticated = useAppSelector(selectIsAuthenticated)
	const requiresPasswordChange = useAppSelector(selectRequiresPasswordChange)

	if (isAuthenticated) {
		return <Navigate to={requiresPasswordChange ? '/change-password' : '/dashboard'} replace />
	}

	return <>{children}</>
}

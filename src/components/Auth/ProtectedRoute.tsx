import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectIsAuthenticated, selectIsAdmin, selectRequiresPasswordChange } from '@/store/features/auth/selector'

interface ProtectedRouteProps {
	children: ReactNode
	adminOnly?: boolean
	allowPasswordChangeRequired?: boolean
}

export const ProtectedRoute = ({ children, adminOnly = false, allowPasswordChangeRequired = false }: ProtectedRouteProps) => {
	const location = useLocation()
	const isAuthenticated = useAppSelector(selectIsAuthenticated)
	const isAdmin = useAppSelector(selectIsAdmin)
	const requiresPasswordChange = useAppSelector(selectRequiresPasswordChange)

	if (!isAuthenticated) {
		return <Navigate to='/login' state={{ from: location }} replace />
	}

	if (requiresPasswordChange && !allowPasswordChangeRequired) {
		return <Navigate to='/change-password' replace />
	}

	if (adminOnly && !isAdmin) {
		return <Navigate to='/' replace />
	}

	return <>{children}</>
}

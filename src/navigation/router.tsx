import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts'
import { EmptyLayout } from '@/layouts'
import { Login, ProtectedRoute, PublicRoute } from '@/components/Auth'
import { RouteError } from '@/components/errors'
import Playground from '@/components/Playground/containers/Playground'

export const router = createBrowserRouter([
	{
		path: '/login',
		element: (
			<PublicRoute>
				<EmptyLayout>
					<Login />
				</EmptyLayout>
			</PublicRoute>
		),
		errorElement: <RouteError />,
	},
	{
		path: '/playground',
		element: (
			<ProtectedRoute>
				<AppLayout>
					<Playground />
				</AppLayout>
			</ProtectedRoute>
		),
		errorElement: <RouteError />,
	},
	{
		path: '/',
		element: <Navigate to='/playground' replace />,
	},
	{
		path: '*',
		element: <Navigate to='/playground' replace />,
	},
])

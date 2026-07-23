import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts'
import { EmptyLayout } from '@/layouts'
import { Login, ProtectedRoute, PublicRoute } from '@/components/Auth'
import { RouteError } from '@/components/errors'
import Playground from '@/components/Playground/containers/Playground'
import {
	AppsPage,
	DashboardPage,
	GamesPage,
	MediaPage,
	PokemonPage,
	PlaceholderModulePage,
	SettingsDashboardPage,
	SettingsIntegrationsPage,
	TodayPage,
	WarcraftPage,
} from '@/pages'

const protectedPage = (element: ReactNode) => (
	<ProtectedRoute>
		<AppLayout>{element}</AppLayout>
	</ProtectedRoute>
)

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
		path: '/',
		element: protectedPage(<DashboardPage />),
		errorElement: <RouteError />,
	},
	{
		path: '/today',
		element: protectedPage(<TodayPage />),
		errorElement: <RouteError />,
	},
	{
		path: '/apps',
		element: protectedPage(<AppsPage />),
		errorElement: <RouteError />,
	},
	{
		path: '/games',
		element: protectedPage(<GamesPage />),
		errorElement: <RouteError />,
	},
	{
		path: '/media',
		element: protectedPage(<MediaPage />),
		errorElement: <RouteError />,
	},
	{
		path: '/media/jellyfin',
		element: protectedPage(
			<PlaceholderModulePage title='Jellyfin' description='Direct Jellyfin sessions, libraries and latest media arrive in Phase 5.' />
		),
		errorElement: <RouteError />,
	},
	{
		path: '/media/requests',
		element: protectedPage(
			<PlaceholderModulePage title='Requests' description='Jellyseerr search and request flows arrive in Phase 5.' />
		),
		errorElement: <RouteError />,
	},
	{
		path: '/downloads',
		element: protectedPage(
			<PlaceholderModulePage title='Downloads' description='qBittorrent, Sonarr and Radarr visibility arrives in Phase 6.' />
		),
		errorElement: <RouteError />,
	},
	{
		path: '/pokemon',
		element: protectedPage(<PokemonPage />),
		errorElement: <RouteError />,
	},
	{
		path: '/warcraft',
		element: protectedPage(<WarcraftPage />),
		errorElement: <RouteError />,
	},
	{
		path: '/network',
		element: protectedPage(
			<PlaceholderModulePage title='Network' description='WireGuard Easy read-only client status arrives in Phase 9.' />
		),
		errorElement: <RouteError />,
	},
	{
		path: '/settings/integrations',
		element: protectedPage(<SettingsIntegrationsPage />),
		errorElement: <RouteError />,
	},
	{
		path: '/settings/dashboard',
		element: protectedPage(<SettingsDashboardPage />),
		errorElement: <RouteError />,
	},
	{
		path: '/playground',
		element: protectedPage(<Playground />),
		errorElement: <RouteError />,
	},
	{
		path: '*',
		element: <Navigate to='/' replace />,
	},
])

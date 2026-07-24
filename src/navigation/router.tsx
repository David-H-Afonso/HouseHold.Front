import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout, EmptyLayout, SettingsLayout } from '@/layouts'
import { Login, ProtectedRoute, PublicRoute } from '@/components/Auth'
import { RouteError } from '@/components/errors'

const AppsPage = lazy(() => import('@/pages/AppsPage').then((module) => ({ default: module.AppsPage })))
const ChangePasswordPage = lazy(() => import('@/pages/ChangePasswordPage').then((module) => ({ default: module.ChangePasswordPage })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const GamesPage = lazy(() => import('@/pages/GamesPage').then((module) => ({ default: module.GamesPage })))
const JellyfinPage = lazy(() => import('@/pages/JellyfinPage').then((module) => ({ default: module.JellyfinPage })))
const InviteAcceptPage = lazy(() => import('@/pages/InviteAcceptPage').then((module) => ({ default: module.InviteAcceptPage })))
const MediaPage = lazy(() => import('@/pages/MediaPage').then((module) => ({ default: module.MediaPage })))
const PokemonPage = lazy(() => import('@/pages/PokemonPage').then((module) => ({ default: module.PokemonPage })))
const SettingsAppsPage = lazy(() => import('@/pages/SettingsAppsPage').then((module) => ({ default: module.SettingsAppsPage })))
const SettingsDashboardPage = lazy(() => import('@/pages/SettingsDashboardPage').then((module) => ({ default: module.SettingsDashboardPage })))
const SettingsIntegrationsPage = lazy(() => import('@/pages/SettingsIntegrationsPage').then((module) => ({ default: module.SettingsIntegrationsPage })))
const SettingsProfilePage = lazy(() => import('@/pages/SettingsProfilePage').then((module) => ({ default: module.SettingsProfilePage })))
const SettingsUsersPage = lazy(() => import('@/pages/SettingsUsersPage').then((module) => ({ default: module.SettingsUsersPage })))
const TodayPage = lazy(() => import('@/pages/TodayPage').then((module) => ({ default: module.TodayPage })))
const WarcraftPage = lazy(() => import('@/pages/WarcraftPage').then((module) => ({ default: module.WarcraftPage })))
const WorkflowsPage = lazy(() => import('@/pages/WorkflowsPage').then((module) => ({ default: module.WorkflowsPage })))
const Playground = lazy(() => import('@/components/Playground/containers/Playground'))

const loading = <div className='route-loading' role='status'><span />Loading module…</div>
const suspended = (element: ReactNode) => <Suspense fallback={loading}>{element}</Suspense>
const protectedPage = (element: ReactNode, adminOnly = false) => <ProtectedRoute adminOnly={adminOnly}><AppLayout>{suspended(element)}</AppLayout></ProtectedRoute>
const settingsPage = (element: ReactNode, adminOnly = false) => protectedPage(<SettingsLayout>{element}</SettingsLayout>, adminOnly)

export const router = createBrowserRouter([
	{ path: '/login', element: <PublicRoute><EmptyLayout><Login /></EmptyLayout></PublicRoute>, errorElement: <RouteError /> },
	{ path: '/change-password', element: <ProtectedRoute allowPasswordChangeRequired><EmptyLayout>{suspended(<ChangePasswordPage />)}</EmptyLayout></ProtectedRoute>, errorElement: <RouteError /> },
	{ path: '/invite', element: <EmptyLayout>{suspended(<InviteAcceptPage />)}</EmptyLayout>, errorElement: <RouteError /> },
	{ path: '/', element: <Navigate to='/dashboard' replace /> },
	{ path: '/dashboard', element: protectedPage(<DashboardPage />), errorElement: <RouteError /> },
	{ path: '/today', element: protectedPage(<TodayPage />), errorElement: <RouteError /> },
	{ path: '/apps', element: protectedPage(<AppsPage />), errorElement: <RouteError /> },
	{ path: '/games', element: protectedPage(<GamesPage />), errorElement: <RouteError /> },
	{ path: '/media', element: protectedPage(<MediaPage />), errorElement: <RouteError /> },
	{ path: '/media/jellyfin', element: <Navigate to='/jellyfin' replace /> },
	{ path: '/jellyfin', element: protectedPage(<JellyfinPage />), errorElement: <RouteError /> },
	{ path: '/pokemon', element: protectedPage(<PokemonPage />), errorElement: <RouteError /> },
	{ path: '/warcraft', element: protectedPage(<WarcraftPage />), errorElement: <RouteError /> },
	{ path: '/workflows', element: protectedPage(<WorkflowsPage />), errorElement: <RouteError /> },
	{ path: '/settings', element: <Navigate to='/settings/integrations' replace /> },
	{ path: '/settings/integrations', element: settingsPage(<SettingsIntegrationsPage />), errorElement: <RouteError /> },
	{ path: '/settings/dashboard', element: settingsPage(<SettingsDashboardPage />), errorElement: <RouteError /> },
	{ path: '/settings/apps', element: settingsPage(<SettingsAppsPage />), errorElement: <RouteError /> },
	{ path: '/settings/profile', element: settingsPage(<SettingsProfilePage />), errorElement: <RouteError /> },
	{ path: '/settings/users', element: settingsPage(<SettingsUsersPage />, true), errorElement: <RouteError /> },
	...(import.meta.env.DEV ? [{ path: '/playground', element: protectedPage(<Playground />, true), errorElement: <RouteError /> }] : []),
	{ path: '*', element: <Navigate to='/dashboard' replace /> },
])

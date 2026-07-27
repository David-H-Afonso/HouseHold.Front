/**
 * API endpoints configuration
 * Centralized location for all API routes used across the Household.Api backend
 */
export const apiRoutes = {
	/** Auth endpoints */
	auth: {
		login: '/auth/login',
		refresh: '/auth/refresh',
		logout: '/auth/logout',
		logoutAll: '/auth/logout-all',
		me: '/auth/me',
		changePassword: '/auth/change-password',
	},

	/** Admin endpoints */
	admin: {
		createUser: '/admin/users',
		users: '/admin/users',
		user: (id: string) => `/admin/users/${id}`,
		resetPassword: (id: string) => `/admin/users/${id}/reset-password`,
		invitations: '/admin/invitations',
	},

	invitations: {
		redeem: '/invitations/redeem',
	},

	settings: {
		preferences: '/api/v1/preferences',
		dashboardLayout: '/api/v1/dashboard/layout',
		resetDashboardLayout: '/api/v1/dashboard/layout/reset',
	},

	/** Food items */
	foodItems: {
		base: '/food-items',
		byId: (id: string) => `/food-items/${id}`,
	},

	/** Dish templates */
	dishTemplates: {
		base: '/dish-templates',
		byId: (id: string) => `/dish-templates/${id}`,
	},

	/** Meal entries */
	mealEntries: {
		base: '/meal-entries',
		byId: (id: string) => `/meal-entries/${id}`,
	},

	/** Rooms */
	rooms: {
		base: '/rooms',
		byId: (id: string) => `/rooms/${id}`,
	},

	/** Task templates */
	taskTemplates: {
		base: '/task-templates',
		byId: (id: string) => `/task-templates/${id}`,
	},

	/** Task instances */
	tasks: {
		today: '/tasks/today',
		completeInstance: (id: string) => `/tasks/instances/${id}/complete`,
	},

	/** Issues */
	issues: {
		base: '/issues',
		byId: (id: string) => `/issues/${id}`,
	},

	/** Integrations */
	integrations: {
		base: '/integrations',
		byId: (id: string) => `/integrations/${id}`,
		health: '/integrations/health',
		healthById: (id: string) => `/integrations/${id}/health`,
		connections: '/integrations/connections',
		connection: (provider: string) => `/integrations/connections/${provider}`,
		authorizeConnection: (provider: string) => `/integrations/connections/${provider}/authorize`,
		testConnection: (provider: string) => `/integrations/connections/${provider}/test`,
	},

	/** Dashboard */
	dashboard: {
		base: '/dashboard',
	},

	/** App launcher */
	apps: {
		base: '/modules/apps',
		byId: (id: string) => `/modules/apps/${id}`,
		categories: '/modules/apps/categories',
		favorite: (id: string) => `/modules/apps/${id}/favorite`,
		update: (id: string) => `/api/v1/admin/casaos/apps/${encodeURIComponent(id)}/update`,
		rollback: (id: string) => `/api/v1/admin/casaos/apps/${encodeURIComponent(id)}/rollback`,
		operations: (id: string) => `/api/v1/admin/casaos/apps/${encodeURIComponent(id)}/actions`,
	},

	casaos: {
		config: '/api/v1/admin/casaos/config',
	},

	/** Games Database gateway */
	games: {
		base: '/modules/games',
		byId: (id: number) => `/modules/games/${id}`,
		status: (id: number) => `/modules/games/${id}/status`,
		statuses: '/modules/games/statuses',
		summary: '/modules/games/summary',
	},

	/** Read-only DoIt daily view */
	today: {
		base: '/modules/today',
		complete: (occurrenceId: string) => `/modules/today/occurrences/${occurrenceId}/complete`,
		undo: (occurrenceId: string) => `/modules/today/occurrences/${occurrenceId}/undo`,
	},

	calendar: {
		events: '/modules/calendar/events',
	},

	/** Jellywatch gateway */
	media: {
		jellywatch: '/modules/media/jellywatch',
	},

	/** Beast Vault gateway */
	pokemon: {
		base: '/modules/pokemon',
		tags: '/modules/pokemon/tags',
		download: (id: number) => `/modules/pokemon/${id}/download`,
	},

	/** Warcraft Archive gateway */
	warcraft: {
		weekly: '/modules/warcraft/weekly',
		status: (id: number | string) => `/modules/warcraft/trackings/${id}/status`,
	},

	jellyfin: {
		base: '/api/v1/jellyfin/dashboard',
		config: '/api/v1/jellyfin/config',
	},

	workflows: {
		base: '/api/v1/github-actions',
		config: '/api/v1/github-actions/config',
	},

	// legacy placeholder kept for TS compatibility
	users: {
		// list: '/api/users',
		// profile: '/api/users/profile',
		// update: '/api/users/update',
	},

	/** Add more API route groups as needed */
} as const

/**
 * Type for API routes structure
 * Provides type safety when accessing routes
 */
export type ApiRoutes = typeof apiRoutes

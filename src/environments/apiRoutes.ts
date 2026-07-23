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
	},

	/** Admin endpoints */
	admin: {
		createUser: '/admin/users',
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
	},

	/** Games Database gateway */
	games: {
		base: '/modules/games',
		byId: (id: number) => `/modules/games/${id}`,
		status: (id: number) => `/modules/games/${id}/status`,
		statuses: '/modules/games/statuses',
		summary: '/modules/games/summary',
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

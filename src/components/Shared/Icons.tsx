import type { ReactNode, SVGProps } from 'react'

export const Icon = ({ name, ...props }: SVGProps<SVGSVGElement> & { name: string }) => {
	const paths: Record<string, ReactNode> = {
		dashboard: <><path d='M4 10.5 12 4l8 6.5' /><path d='M6 9.5V20h12V9.5' /><path d='M10 20v-5h4v5' /></>,
		home: <><path d='M3.5 10.5 12 3.8l8.5 6.7' /><path d='M5.5 9.5V20h13V9.5' /><path d='M10 20v-5h4v5' /></>,
		today: <><rect x='4' y='5' width='16' height='16' rx='2' /><path d='M8 3v4m8-4v4M4 10h16' /><path d='m8 15 2 2 5-5' /></>,
		calendar: <><rect x='4' y='5' width='16' height='16' rx='2' /><path d='M8 3v4m8-4v4M4 10h16M8 14h.01m4 0h.01m4 0h.01M8 17h.01m4 0h.01' /></>,
		apps: <><rect x='4' y='4' width='6' height='6' rx='1.5' /><rect x='14' y='4' width='6' height='6' rx='1.5' /><rect x='4' y='14' width='6' height='6' rx='1.5' /><rect x='14' y='14' width='6' height='6' rx='1.5' /></>,
		games: <><path d='M8 8h8a5 5 0 0 1 4.7 6.7l-1 2.8a2 2 0 0 1-3.3.8L14.8 17H9.2l-1.6 1.3a2 2 0 0 1-3.3-.8l-1-2.8A5 5 0 0 1 8 8Z' /><path d='M7 11v4m-2-2h4m7-1h.01m2 2h.01' /></>,
		media: <><rect x='3' y='4' width='18' height='16' rx='2' /><path d='m10 9 5 3-5 3Z' /><path d='M7 4v2m10-2v2M7 18v2m10-2v2' /></>,
		requests: <><path d='M7 3.5h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z' /><path d='M9 8h6m-6 4h6m-6 4h3' /></>,
		pokemon: <><path d='m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z' /><path d='m4 7.5 8 4.5 8-4.5M12 12v9' /></>,
		warcraft: <><path d='M7 4h10l2 4-2 10H7L5 8l2-4Z' /><path d='M9 8h6m-3 0v7m-3 0h6' /></>,
		jellyfin: <><rect x='4' y='4' width='16' height='16' rx='2' /><path d='M8 4v16m8-16v16M4 8h4m8 0h4M4 16h4m8 0h4' /></>,
		workflows: <><circle cx='6' cy='6' r='2' /><circle cx='18' cy='18' r='2' /><path d='M8 6h4a4 4 0 0 1 4 4v6m-8 2h4a4 4 0 0 0 4-4V8' /></>,
		settings: <><circle cx='12' cy='12' r='3' /><path d='M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z' /></>,
		menu: <path d='M4 7h16M4 12h16M4 17h16' />,
		close: <path d='m6 6 12 12M18 6 6 18' />,
		logout: <><path d='M10 5H5v14h5m4-4 4-3-4-3m4 3H9' /></>,
		external: <><path d='M14 4h6v6m0-6-9 9' /><path d='M18 13v6H5V6h6' /></>,
		chevronLeft: <path d='m15 18-6-6 6-6' />,
		chevronRight: <path d='m9 18 6-6-6-6' />,
		arrowUp: <path d='m7 14 5-5 5 5' />,
		arrowDown: <path d='m7 10 5 5 5-5' />,
		refresh: <><path d='M20 7v5h-5' /><path d='M19 12a7 7 0 1 1-2-5' /></>,
		download: <><path d='M12 3v12m-4-4 4 4 4-4' /><path d='M5 19h14' /></>,
		star: <path d='m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z' />,
	}
	return <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true' {...props}>{paths[name]}</svg>
}

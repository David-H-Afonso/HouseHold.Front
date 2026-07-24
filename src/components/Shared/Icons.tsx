import type { ReactNode, SVGProps } from 'react'

export const Icon = ({ name, ...props }: SVGProps<SVGSVGElement> & { name: string }) => {
	const paths: Record<string, ReactNode> = {
		dashboard: <><rect x='3' y='3' width='7' height='7' rx='1' /><rect x='14' y='3' width='7' height='7' rx='1' /><rect x='3' y='14' width='7' height='7' rx='1' /><rect x='14' y='14' width='7' height='7' rx='1' /></>,
		today: <><path d='M7 3v3m10-3v3M4 9h16' /><rect x='4' y='5' width='16' height='16' rx='2' /><path d='m8 15 2 2 5-5' /></>,
		apps: <><rect x='3' y='3' width='7' height='7' rx='2' /><rect x='14' y='3' width='7' height='7' rx='2' /><rect x='3' y='14' width='7' height='7' rx='2' /><rect x='14' y='14' width='7' height='7' rx='2' /></>,
		games: <><path d='M8 8h8a5 5 0 0 1 4.7 6.7l-1 2.8a2 2 0 0 1-3.3.8L14.8 17H9.2l-1.6 1.3a2 2 0 0 1-3.3-.8l-1-2.8A5 5 0 0 1 8 8Z' /><path d='M7 11v4m-2-2h4m7-1h.01m2 2h.01' /></>,
		media: <><rect x='3' y='5' width='18' height='14' rx='2' /><path d='m10 9 5 3-5 3Z' /></>,
		pokemon: <><circle cx='12' cy='12' r='9' /><path d='M3 12h6m6 0h6' /><circle cx='12' cy='12' r='3' /></>,
		warcraft: <><path d='M12 3 4 7v5c0 4.8 3.4 7.8 8 9 4.6-1.2 8-4.2 8-9V7l-8-4Z' /><path d='m9 9 6 6m0-6-6 6' /></>,
		jellyfin: <><path d='m12 3 8 16H4L12 3Z' /><path d='m12 8 4 8H8l4-8Z' /></>,
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

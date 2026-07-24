try {
	var theme = localStorage.getItem('household:theme') || 'system'
	document.documentElement.dataset.theme = theme
	document.documentElement.style.colorScheme = theme === 'system' ? 'light dark' : theme
} catch (_) {
	document.documentElement.dataset.theme = 'system'
	document.documentElement.style.colorScheme = 'light dark'
}

interface SearchBarProps {
	value: string
	placeholder?: string
	onChange: (value: string) => void
}

export const SearchBar = ({ value, placeholder = 'Search', onChange }: SearchBarProps) => {
	return (
		<label className='search-bar'>
			<span className='sr-only'>Search</span>
			<input name='search' value={value} placeholder={placeholder.endsWith('…') ? placeholder : `${placeholder}…`} onChange={(event) => onChange(event.target.value)} autoComplete='off' />
		</label>
	)
}

interface FilterTabsProps {
	options: string[]
	value: string
	onChange: (value: string) => void
}

export const FilterTabs = ({ options, value, onChange }: FilterTabsProps) => {
	return (
		<div className='filter-tabs' role='tablist'>
			{options.map((option) => (
				<button
					key={option}
					type='button'
					role='tab'
					aria-selected={option === value}
					className={option === value ? 'filter-tabs__tab filter-tabs__tab--active' : 'filter-tabs__tab'}
					onClick={() => onChange(option)}
				>
					{option}
				</button>
			))}
		</div>
	)
}

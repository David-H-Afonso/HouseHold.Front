interface SeerrPaginationProps {
	page: number
	totalPages: number
	label: string
	onChange: (page: number) => void
}

export const SeerrPagination = ({ page, totalPages, label, onChange }: SeerrPaginationProps) => {
	if (totalPages <= 1) return null
	return <nav className='seerr-pagination' aria-label={label}>
		<button type='button' onClick={() => onChange(page - 1)} disabled={page <= 1}>Previous</button>
		<span aria-live='polite'>Page <strong>{page}</strong> of {totalPages}</span>
		<button type='button' onClick={() => onChange(page + 1)} disabled={page >= totalPages}>Next</button>
	</nav>
}

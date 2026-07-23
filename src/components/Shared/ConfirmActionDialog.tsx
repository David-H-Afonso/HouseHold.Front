interface ConfirmActionDialogProps {
	open: boolean
	title: string
	description: string
	confirmLabel?: string
	onConfirm: () => void
	onCancel: () => void
}

export const ConfirmActionDialog = ({
	open,
	title,
	description,
	confirmLabel = 'Confirm',
	onConfirm,
	onCancel,
}: ConfirmActionDialogProps) => {
	if (!open) return null

	return (
		<div className='dialog-backdrop' role='presentation'>
			<div className='confirm-dialog' role='dialog' aria-modal='true' aria-labelledby='confirm-title'>
				<h2 id='confirm-title'>{title}</h2>
				<p>{description}</p>
				<div className='confirm-dialog__actions'>
					<button type='button' onClick={onCancel}>
						Cancel
					</button>
					<button type='button' className='button-danger' onClick={onConfirm}>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	)
}

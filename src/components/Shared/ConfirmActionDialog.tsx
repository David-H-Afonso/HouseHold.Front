import { useEffect, useId, useState, type RefObject } from 'react'
import { useModalFocus } from '@/hooks/useModalFocus'

interface ConfirmActionDialogProps {
	open: boolean
	title: string
	description: string
	confirmLabel?: string
	requiredPhrase?: string
	busy?: boolean
	error?: string | null
	onConfirm: () => void
	onCancel: () => void
}

export const ConfirmActionDialog = ({
	open,
	title,
	description,
	confirmLabel = 'Confirm',
	requiredPhrase,
	busy = false,
	error,
	onConfirm,
	onCancel,
}: ConfirmActionDialogProps) => {
	const [confirmation, setConfirmation] = useState('')
	const cancel = () => { if (!busy) onCancel() }
	const dialogRef = useModalFocus(open, cancel)
	const titleId = useId()
	const descriptionId = useId()
	const confirmationId = useId()
	const errorId = useId()
	const matches = !requiredPhrase || confirmation === requiredPhrase

	useEffect(() => {
		if (open) setConfirmation('')
	}, [open, requiredPhrase])

	if (!open) return null

	return (
		<div className='dialog-backdrop' role='presentation' onMouseDown={(event) => { if (event.target === event.currentTarget) cancel() }}>
			<div ref={dialogRef as RefObject<HTMLDivElement>} className='confirm-dialog' role='dialog' aria-modal='true' aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={busy} tabIndex={-1}>
				<form onSubmit={(event) => { event.preventDefault(); if (matches && !busy) onConfirm() }}>
					<h2 id={titleId}>{title}</h2>
					<p id={descriptionId}>{description}</p>
					{requiredPhrase && <label className='confirm-dialog__field' htmlFor={confirmationId}>
						<span>Enter <code>{requiredPhrase}</code> to continue</span>
						<input
							id={confirmationId}
							value={confirmation}
							onChange={(event) => setConfirmation(event.target.value)}
							autoComplete='off'
							autoCapitalize='off'
							spellCheck={false}
							disabled={busy}
							aria-invalid={Boolean(confirmation) && !matches}
							aria-describedby={error ? errorId : undefined}
						/>
					</label>}
					{error && <p className='confirm-dialog__error' id={errorId} role='alert'>{error}</p>}
					<div className='confirm-dialog__actions'>
						<button type='button' onClick={cancel} disabled={busy}>Cancel</button>
						<button type='submit' className='button-danger' disabled={!matches || busy}>
							{busy ? 'Submitting…' : confirmLabel}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

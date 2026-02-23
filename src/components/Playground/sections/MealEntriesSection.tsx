import { useState } from 'react'
import { foodService } from '@/services'
import { useApiCall } from '@/hooks/useApiCall'
import { ApiResultPanel } from '../elements/ApiResultPanel'
import { MealStatus } from '@/models/api/Food'

export const MealEntriesSection = () => {
	const [from, setFrom] = useState('')
	const [to, setTo] = useState('')
	const [listState, listActions] = useApiCall()

	// Create form
	const [eatenAt, setEatenAt] = useState('')
	const [title, setTitle] = useState('')
	const [dishTemplateId, setDishTemplateId] = useState('')
	const [status, setStatus] = useState<MealStatus>(MealStatus.Draft)
	const [notes, setNotes] = useState('')
	const [rawItems, setRawItems] = useState('') // JSON array fallback
	const [createState, createActions] = useApiCall()

	// CRUD by id
	const [targetId, setTargetId] = useState('')
	const [getState, getActions] = useApiCall()
	const [updateState, updateActions] = useApiCall()
	const [deleteState, deleteActions] = useApiCall()

	const bodyFromForm = () => {
		let items
		try {
			items = rawItems.trim() ? JSON.parse(rawItems) : undefined
		} catch {
			items = undefined
		}
		return {
			eatenAt: eatenAt || undefined,
			title: title || undefined,
			dishTemplateId: dishTemplateId || undefined,
			status,
			notes: notes || undefined,
			items,
		}
	}

	return (
		<section className='pg-section'>
			<h2 className='pg-section__title'>E) Meal Entries</h2>

			{/* List */}
			<div className='pg-form'>
				<h3>GET /meal-entries</h3>
				<div className='pg-form__row'>
					<label>From (ISO date)</label>
					<input type='datetime-local' value={from} onChange={(e) => setFrom(e.target.value)} />
				</div>
				<div className='pg-form__row'>
					<label>To (ISO date)</label>
					<input type='datetime-local' value={to} onChange={(e) => setTo(e.target.value)} />
				</div>
				<button
					onClick={() =>
						listActions.call(() => foodService.listMealEntries(from || undefined, to || undefined))
					}
					disabled={listState.loading}>
					List
				</button>
				<ApiResultPanel state={listState} label='GET /meal-entries' />
			</div>

			{/* Create */}
			<div className='pg-form'>
				<h3>POST /meal-entries</h3>
				<div className='pg-form__row'>
					<label>Eaten at</label>
					<input
						type='datetime-local'
						value={eatenAt}
						onChange={(e) => setEatenAt(e.target.value)}
					/>
				</div>
				<div className='pg-form__row'>
					<label>Title</label>
					<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder='Desayuno' />
				</div>
				<div className='pg-form__row'>
					<label>Dish Template ID (opt.)</label>
					<input
						value={dishTemplateId}
						onChange={(e) => setDishTemplateId(e.target.value)}
						placeholder='xxxxxxxx-...'
					/>
				</div>
				<div className='pg-form__row'>
					<label>Status</label>
					<select value={status} onChange={(e) => setStatus(e.target.value as MealStatus)}>
						<option value={MealStatus.Draft}>Draft</option>
						<option value={MealStatus.Final}>Final</option>
					</select>
				</div>
				<div className='pg-form__row'>
					<label>Notes</label>
					<input value={notes} onChange={(e) => setNotes(e.target.value)} />
				</div>
				<div className='pg-form__row'>
					<label>Items JSON (opt.)</label>
					<textarea
						value={rawItems}
						onChange={(e) => setRawItems(e.target.value)}
						placeholder={'[{"foodItemId":"...", "grams":150}]'}
						rows={3}
					/>
				</div>
				<button
					onClick={() => {
						const b = bodyFromForm()
						createActions.call(() => foodService.createMealEntry(b), b)
					}}
					disabled={createState.loading}>
					Create
				</button>
				<ApiResultPanel state={createState} label='POST /meal-entries' />
			</div>

			{/* Get / Update (recalc MealType) / Delete */}
			<div className='pg-form'>
				<h3>GET | PUT | DELETE /meal-entries/:id</h3>
				<div className='pg-form__row'>
					<label>Meal Entry ID</label>
					<input
						value={targetId}
						onChange={(e) => setTargetId(e.target.value)}
						placeholder='xxxxxxxx-...'
					/>
				</div>
				<div className='pg-form__buttons'>
					<button
						onClick={() => getActions.call(() => foodService.getMealEntry(targetId))}
						disabled={getState.loading || !targetId}>
						Get
					</button>
					<button
						onClick={() => {
							const b = bodyFromForm()
							updateActions.call(() => foodService.updateMealEntry(targetId, b), b)
						}}
						disabled={updateState.loading || !targetId}>
						Update → recalcs MealType
					</button>
					<button
						onClick={() =>
							deleteActions.call(() => foodService.deleteMealEntry(targetId), { id: targetId })
						}
						disabled={deleteState.loading || !targetId}
						className='btn--danger'>
						Delete
					</button>
				</div>
				<ApiResultPanel state={getState} label='GET /meal-entries/:id' />
				<ApiResultPanel state={updateState} label='PUT /meal-entries/:id' />
				<ApiResultPanel state={deleteState} label='DELETE /meal-entries/:id' />
			</div>
		</section>
	)
}

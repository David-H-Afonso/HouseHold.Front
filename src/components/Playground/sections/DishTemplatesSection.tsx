import { useState } from 'react'
import { foodService } from '@/services'
import { useApiCall } from '@/hooks/useApiCall'
import { ApiResultPanel } from '../elements/ApiResultPanel'
import type { DishTemplateItemInput } from '@/models/api/Food'

export const DishTemplatesSection = () => {
	const [listState, listActions] = useApiCall()
	const [getState, getActions] = useApiCall()
	const [createState, createActions] = useApiCall()
	const [updateState, updateActions] = useApiCall()
	const [deleteState, deleteActions] = useApiCall()

	// Create form
	const [name, setName] = useState('')
	const [isShared, setIsShared] = useState(false)
	const [items, setItems] = useState<DishTemplateItemInput[]>([
		{ foodItemId: '', grams: 100, sortOrder: 0 },
	])

	const [targetId, setTargetId] = useState('')

	const addItem = () =>
		setItems((prev) => [...prev, { foodItemId: '', grams: 100, sortOrder: prev.length }])
	const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))
	const updateItem = (i: number, field: keyof DishTemplateItemInput, value: string | number) =>
		setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)))

	const bodyFromForm = () => ({
		name,
		isShared,
		items: items.filter((i) => i.foodItemId.trim()),
	})

	return (
		<section className='pg-section'>
			<h2 className='pg-section__title'>D) Dish Templates</h2>

			{/* List */}
			<div className='pg-form'>
				<h3>GET /dish-templates</h3>
				<button
					onClick={() => listActions.call(() => foodService.listDishTemplates())}
					disabled={listState.loading}>
					List all
				</button>
				<ApiResultPanel state={listState} label='GET /dish-templates' />
			</div>

			{/* Create */}
			<div className='pg-form'>
				<h3>POST /dish-templates</h3>
				<div className='pg-form__row'>
					<label>Name</label>
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder='Ensalada mediterránea'
					/>
				</div>
				<div className='pg-form__row'>
					<label>
						<input
							type='checkbox'
							checked={isShared}
							onChange={(e) => setIsShared(e.target.checked)}
						/>{' '}
						Shared
					</label>
				</div>

				<div className='pg-form__subgroup'>
					<p>
						<strong>Items</strong>
					</p>
					{items.map((item, i) => (
						<div key={i} className='pg-form__row pg-form__row--inline'>
							<input
								value={item.foodItemId}
								onChange={(e) => updateItem(i, 'foodItemId', e.target.value)}
								placeholder='FoodItem ID'
								style={{ flex: 2 }}
							/>
							<input
								type='number'
								value={item.grams}
								onChange={(e) => updateItem(i, 'grams', parseFloat(e.target.value))}
								placeholder='grams'
								style={{ width: 80 }}
							/>
							<input
								type='number'
								value={item.sortOrder}
								onChange={(e) => updateItem(i, 'sortOrder', parseInt(e.target.value))}
								placeholder='order'
								style={{ width: 60 }}
							/>
							<button onClick={() => removeItem(i)} className='btn--sm btn--danger'>
								✕
							</button>
						</div>
					))}
					<button onClick={addItem} className='btn--sm'>
						+ Item
					</button>
				</div>

				<button
					onClick={() => {
						const b = bodyFromForm()
						createActions.call(() => foodService.createDishTemplate(b), b)
					}}
					disabled={createState.loading}>
					Create
				</button>
				<ApiResultPanel state={createState} label='POST /dish-templates' />
			</div>

			{/* Get / Update / Delete */}
			<div className='pg-form'>
				<h3>GET | PUT | DELETE /dish-templates/:id</h3>
				<div className='pg-form__row'>
					<label>Dish Template ID</label>
					<input
						value={targetId}
						onChange={(e) => setTargetId(e.target.value)}
						placeholder='xxxxxxxx-...'
					/>
				</div>
				<div className='pg-form__buttons'>
					<button
						onClick={() => getActions.call(() => foodService.getDishTemplate(targetId))}
						disabled={getState.loading || !targetId}>
						Get
					</button>
					<button
						onClick={() => {
							const b = bodyFromForm()
							updateActions.call(() => foodService.updateDishTemplate(targetId, b), b)
						}}
						disabled={updateState.loading || !targetId}>
						Update (uses form)
					</button>
					<button
						onClick={() =>
							deleteActions.call(() => foodService.deleteDishTemplate(targetId), { id: targetId })
						}
						disabled={deleteState.loading || !targetId}
						className='btn--danger'>
						Delete
					</button>
				</div>
				<ApiResultPanel state={getState} label='GET /dish-templates/:id' />
				<ApiResultPanel state={updateState} label='PUT /dish-templates/:id' />
				<ApiResultPanel state={deleteState} label='DELETE /dish-templates/:id' />
			</div>
		</section>
	)
}

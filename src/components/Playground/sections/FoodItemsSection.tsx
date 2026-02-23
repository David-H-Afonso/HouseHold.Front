import { useState } from 'react'
import { foodService } from '@/services'
import { useApiCall } from '@/hooks/useApiCall'
import { ApiResultPanel } from '../elements/ApiResultPanel'

export const FoodItemsSection = () => {
	// List
	const [search, setSearch] = useState('')
	const [listState, listActions] = useApiCall()

	// Create / Update form
	const [name, setName] = useState('')
	const [kcal, setKcal] = useState('')
	const [protein, setProtein] = useState('')
	const [carbs, setCarbs] = useState('')
	const [fat, setFat] = useState('')
	const [createState, createActions] = useApiCall()

	// Get / Update / Delete by id
	const [targetId, setTargetId] = useState('')
	const [getState, getActions] = useApiCall()
	const [updateState, updateActions] = useApiCall()
	const [deleteState, deleteActions] = useApiCall()

	const macroBody = () => ({
		name,
		kcalPer100g: parseFloat(kcal),
		proteinPer100g: parseFloat(protein),
		carbsPer100g: parseFloat(carbs),
		fatPer100g: parseFloat(fat),
	})

	return (
		<section className='pg-section'>
			<h2 className='pg-section__title'>C) Food Items</h2>

			{/* List */}
			<div className='pg-form'>
				<h3>GET /food-items</h3>
				<div className='pg-form__row'>
					<label>Search</label>
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder='pollo, arroz…'
					/>
				</div>
				<button
					onClick={() => listActions.call(() => foodService.listFoodItems(search || undefined))}
					disabled={listState.loading}>
					List food items
				</button>
				<ApiResultPanel state={listState} label='GET /food-items' />
			</div>

			{/* Create */}
			<div className='pg-form'>
				<h3>POST /food-items</h3>
				<div className='pg-form__row'>
					<label>Name</label>
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder='Pollo a la plancha'
					/>
				</div>
				<div className='pg-form__row'>
					<label>Kcal/100g</label>
					<input
						type='number'
						value={kcal}
						onChange={(e) => setKcal(e.target.value)}
						placeholder='165'
					/>
				</div>
				<div className='pg-form__row'>
					<label>Protein/100g</label>
					<input
						type='number'
						value={protein}
						onChange={(e) => setProtein(e.target.value)}
						placeholder='31'
					/>
				</div>
				<div className='pg-form__row'>
					<label>Carbs/100g</label>
					<input
						type='number'
						value={carbs}
						onChange={(e) => setCarbs(e.target.value)}
						placeholder='0'
					/>
				</div>
				<div className='pg-form__row'>
					<label>Fat/100g</label>
					<input
						type='number'
						value={fat}
						onChange={(e) => setFat(e.target.value)}
						placeholder='3.6'
					/>
				</div>
				<button
					onClick={() => {
						const b = macroBody()
						createActions.call(() => foodService.createFoodItem(b), b)
					}}
					disabled={createState.loading}>
					Create
				</button>
				<ApiResultPanel state={createState} label='POST /food-items' />
			</div>

			{/* Get / Update / Delete */}
			<div className='pg-form'>
				<h3>GET | PUT | DELETE /food-items/:id</h3>
				<div className='pg-form__row'>
					<label>Food item ID</label>
					<input
						value={targetId}
						onChange={(e) => setTargetId(e.target.value)}
						placeholder='xxxxxxxx-...'
					/>
				</div>
				<div className='pg-form__buttons'>
					<button
						onClick={() => getActions.call(() => foodService.getFoodItem(targetId))}
						disabled={getState.loading || !targetId}>
						Get by ID
					</button>
					<button
						onClick={() => {
							const b = macroBody()
							updateActions.call(() => foodService.updateFoodItem(targetId, b), b)
						}}
						disabled={updateState.loading || !targetId}>
						Update (uses form above)
					</button>
					<button
						onClick={() =>
							deleteActions.call(() => foodService.deleteFoodItem(targetId), { id: targetId })
						}
						disabled={deleteState.loading || !targetId}
						className='btn--danger'>
						Delete
					</button>
				</div>
				<ApiResultPanel state={getState} label='GET /food-items/:id' />
				<ApiResultPanel state={updateState} label='PUT /food-items/:id' />
				<ApiResultPanel state={deleteState} label='DELETE /food-items/:id' />
			</div>
		</section>
	)
}

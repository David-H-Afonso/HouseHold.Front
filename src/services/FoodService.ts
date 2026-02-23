import { environment } from '@/environments'
import { customFetch } from '@/utils'
import type {
	FoodItem,
	CreateFoodItemRequest,
	UpdateFoodItemRequest,
	DishTemplate,
	CreateDishTemplateRequest,
	UpdateDishTemplateRequest,
	MealEntry,
	CreateMealEntryRequest,
	UpdateMealEntryRequest,
} from '@/models/api/Food'

const { foodItems, dishTemplates, mealEntries } = environment.apiRoutes

class FoodService {
	// ── Food items ─────────────────────────────────────────────────────────

	listFoodItems(search?: string): Promise<FoodItem[]> {
		return customFetch<FoodItem[]>(foodItems.base, {
			params: search ? { search } : undefined,
		})
	}

	getFoodItem(id: string): Promise<FoodItem> {
		return customFetch<FoodItem>(foodItems.byId(id))
	}

	createFoodItem(request: CreateFoodItemRequest): Promise<FoodItem> {
		return customFetch<FoodItem>(foodItems.base, { method: 'POST', body: request })
	}

	updateFoodItem(id: string, request: UpdateFoodItemRequest): Promise<FoodItem> {
		return customFetch<FoodItem>(foodItems.byId(id), { method: 'PUT', body: request })
	}

	deleteFoodItem(id: string): Promise<void> {
		return customFetch<void>(foodItems.byId(id), { method: 'DELETE' })
	}

	// ── Dish templates ─────────────────────────────────────────────────────

	listDishTemplates(): Promise<DishTemplate[]> {
		return customFetch<DishTemplate[]>(dishTemplates.base)
	}

	getDishTemplate(id: string): Promise<DishTemplate> {
		return customFetch<DishTemplate>(dishTemplates.byId(id))
	}

	createDishTemplate(request: CreateDishTemplateRequest): Promise<DishTemplate> {
		return customFetch<DishTemplate>(dishTemplates.base, { method: 'POST', body: request })
	}

	updateDishTemplate(id: string, request: UpdateDishTemplateRequest): Promise<DishTemplate> {
		return customFetch<DishTemplate>(dishTemplates.byId(id), { method: 'PUT', body: request })
	}

	deleteDishTemplate(id: string): Promise<void> {
		return customFetch<void>(dishTemplates.byId(id), { method: 'DELETE' })
	}

	// ── Meal entries ───────────────────────────────────────────────────────

	listMealEntries(from?: string, to?: string): Promise<MealEntry[]> {
		return customFetch<MealEntry[]>(mealEntries.base, {
			params: { ...(from && { from }), ...(to && { to }) },
		})
	}

	getMealEntry(id: string): Promise<MealEntry> {
		return customFetch<MealEntry>(mealEntries.byId(id))
	}

	createMealEntry(request: CreateMealEntryRequest): Promise<MealEntry> {
		return customFetch<MealEntry>(mealEntries.base, { method: 'POST', body: request })
	}

	updateMealEntry(id: string, request: UpdateMealEntryRequest): Promise<MealEntry> {
		return customFetch<MealEntry>(mealEntries.byId(id), { method: 'PUT', body: request })
	}

	deleteMealEntry(id: string): Promise<void> {
		return customFetch<void>(mealEntries.byId(id), { method: 'DELETE' })
	}
}

export const foodService = new FoodService()

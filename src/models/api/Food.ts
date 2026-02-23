// ── Enums ──────────────────────────────────────────────────────────────────

export const MealType = {
	Breakfast: 'Breakfast',
	MorningSnack: 'MorningSnack',
	Lunch: 'Lunch',
	AfternoonSnack: 'AfternoonSnack',
	Dinner: 'Dinner',
	Other: 'Other',
} as const
export type MealType = (typeof MealType)[keyof typeof MealType]

export const MealStatus = {
	Draft: 'Draft',
	Final: 'Final',
} as const
export type MealStatus = (typeof MealStatus)[keyof typeof MealStatus]

// ── Food models ────────────────────────────────────────────────────────────

export interface FoodItem {
	id: string
	name: string
	kcalPer100g: number
	proteinPer100g: number
	carbsPer100g: number
	fatPer100g: number
	createdByUserId: string
	createdAt: string
	updatedAt: string
}

export interface CreateFoodItemRequest {
	name: string
	kcalPer100g: number
	proteinPer100g: number
	carbsPer100g: number
	fatPer100g: number
}

export type UpdateFoodItemRequest = CreateFoodItemRequest

// ── Dish templates ─────────────────────────────────────────────────────────

export interface DishTemplateItemDto {
	id: string
	foodItemId: string
	foodItemName: string
	grams: number
	sortOrder: number
}

export interface DishTemplate {
	id: string
	name: string
	isShared: boolean
	ownerUserId: string
	items: DishTemplateItemDto[]
	createdAt: string
	updatedAt: string
}

export interface DishTemplateItemInput {
	foodItemId: string
	grams: number
	sortOrder: number
}

export interface CreateDishTemplateRequest {
	name: string
	isShared: boolean
	items?: DishTemplateItemInput[]
}

export type UpdateDishTemplateRequest = CreateDishTemplateRequest

// ── Meal entries ───────────────────────────────────────────────────────────

export interface MealEntryItemDto {
	id: string
	foodItemId: string
	foodItemName: string
	grams: number
	kcalPer100g: number
	proteinPer100g: number
	carbsPer100g: number
	fatPer100g: number
}

export interface MealEntry {
	id: string
	userId: string
	eatenAt?: string
	mealType?: MealType
	title?: string
	dishTemplateId?: string
	dishTemplateName?: string
	status: MealStatus
	notes?: string
	items: MealEntryItemDto[]
	totalKcal: number
	totalProtein: number
	totalCarbs: number
	totalFat: number
	createdAt: string
	updatedAt: string
}

export interface MealEntryItemInput {
	foodItemId: string
	grams: number
}

export interface CreateMealEntryRequest {
	eatenAt?: string
	title?: string
	dishTemplateId?: string
	status: MealStatus
	notes?: string
	items?: MealEntryItemInput[]
}

export type UpdateMealEntryRequest = CreateMealEntryRequest

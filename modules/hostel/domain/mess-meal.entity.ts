export type MealTypeValue = "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER";
export type DietTypeValue = "VEG" | "NON_VEG" | "JAIN" | "VEGAN" | "OTHER";

// The item within a MessMealPlan — mirrors FeeStructureItem's "item under a container" shape.
export interface MessMealEntity {
  id: string;
  tenantId: string;
  mealPlanId: string;
  mealType: MealTypeValue;
  dietType: DietTypeValue;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

import { z } from "zod";
import type { SalaryCalculationTypeValue, SalaryComponentTypeValue } from "../../domain/salary-structure.entity";

export const createSalaryStructureSchema = z.object({
  schoolId: z.string().uuid("School is required."),
  name: z.string().trim().min(1, "Name is required."),
});
export type CreateSalaryStructureServiceInput = z.infer<typeof createSalaryStructureSchema>;

export const updateSalaryStructureSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").optional(),
  isActive: z.boolean().optional(),
});
export type UpdateSalaryStructureServiceInput = z.infer<typeof updateSalaryStructureSchema>;

export interface SalaryStructureDTO {
  id: string;
  schoolId: string;
  name: string;
  isActive: boolean;
}

export interface SalaryStructureWithComponentsDTO extends SalaryStructureDTO {
  components: SalaryComponentDTO[];
}

const componentTypeEnum = z.enum(["EARNING", "DEDUCTION"]);
const calculationTypeEnum = z.enum(["FLAT", "PERCENTAGE_OF_BASIC"]);

export const addSalaryComponentSchema = z.object({
  salaryStructureId: z.string().uuid("Salary structure is required."),
  name: z.string().trim().min(1, "Name is required."),
  code: z
    .string()
    .trim()
    .min(1, "Code is required.")
    .max(20, "Code must be 20 characters or fewer.")
    .regex(/^[A-Z0-9_]+$/, "Code must be uppercase letters, digits, or underscores."),
  componentType: componentTypeEnum,
  calculationType: calculationTypeEnum,
  value: z.number().positive("Value must be greater than zero."),
  isStatutory: z.boolean().optional(),
});
export type AddSalaryComponentServiceInput = z.infer<typeof addSalaryComponentSchema>;

export const updateSalaryComponentSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").optional(),
  componentType: componentTypeEnum.optional(),
  calculationType: calculationTypeEnum.optional(),
  value: z.number().positive("Value must be greater than zero.").optional(),
  isStatutory: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateSalaryComponentServiceInput = z.infer<typeof updateSalaryComponentSchema>;

export interface SalaryComponentDTO {
  id: string;
  salaryStructureId: string;
  name: string;
  code: string;
  componentType: SalaryComponentTypeValue;
  calculationType: SalaryCalculationTypeValue;
  value: number;
  isStatutory: boolean;
  isActive: boolean;
}

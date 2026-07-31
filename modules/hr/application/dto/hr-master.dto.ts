import { z } from "zod";

// --- Department --------------------------------------------------------------------------------

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  code: z.string().trim().min(1, "Code is required."),
});
export type CreateDepartmentServiceInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateDepartmentServiceInput = z.infer<typeof updateDepartmentSchema>;

export interface DepartmentDTO {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  isActive: boolean;
}

// --- Designation ---------------------------------------------------------------------------------

export const createDesignationSchema = z.object({
  departmentId: z.string().uuid("Invalid department id.").optional(),
  name: z.string().trim().min(1, "Name is required."),
  code: z.string().trim().min(1, "Code is required."),
});
export type CreateDesignationServiceInput = z.infer<typeof createDesignationSchema>;

export const updateDesignationSchema = z.object({
  departmentId: z.string().uuid("Invalid department id.").nullable().optional(),
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateDesignationServiceInput = z.infer<typeof updateDesignationSchema>;

export interface DesignationDTO {
  id: string;
  schoolId: string;
  departmentId: string | null;
  name: string;
  code: string;
  isActive: boolean;
}

// --- EmploymentType ------------------------------------------------------------------------------

export const createEmploymentTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  code: z.string().trim().min(1, "Code is required."),
});
export type CreateEmploymentTypeServiceInput = z.infer<typeof createEmploymentTypeSchema>;

export const updateEmploymentTypeSchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateEmploymentTypeServiceInput = z.infer<typeof updateEmploymentTypeSchema>;

export interface EmploymentTypeDTO {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  isActive: boolean;
}

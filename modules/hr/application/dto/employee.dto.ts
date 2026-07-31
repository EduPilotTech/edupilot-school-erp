import { z } from "zod";
import type { EmploymentStatusValue } from "../../domain/employee.entity";

export const employmentStatusSchema = z.enum([
  "ACTIVE",
  "ON_PROBATION",
  "ON_LEAVE",
  "SUSPENDED",
  "RESIGNED",
  "TERMINATED",
  "RETIRED",
]);

// Promotes an existing UserProfile into an Employee record — never creates a new UserProfile,
// mirroring Teacher's own exact precedent (Phase 6 Decision 1: UserProfile remains the identity,
// Employee is a 1:1 extension). The UserProfile is created separately via modules/users.
export const createEmployeeSchema = z.object({
  userProfileId: z.string().uuid("Invalid user id."),
  departmentId: z.string().uuid("Department is required."),
  designationId: z.string().uuid("Designation is required."),
  employmentTypeId: z.string().uuid("Employment type is required."),
  reportingManagerId: z.string().uuid("Invalid reporting manager id.").optional(),
  employeeCode: z.string().trim().min(1, "Employee code is required.").max(50),
  joiningDate: z.coerce.date(),
  confirmationDate: z.coerce.date().optional(),
  employmentStatus: employmentStatusSchema.optional(),
  qualification: z.string().trim().max(200).optional(),
  experienceYears: z.number().int().min(0).max(80).optional(),
  emergencyContactName: z.string().trim().max(200).optional(),
  emergencyContactPhone: z.string().trim().max(30).optional(),
  emergencyContactRelation: z.string().trim().max(100).optional(),
});
export type CreateEmployeeServiceInput = z.infer<typeof createEmployeeSchema>;

// `employeeCode` is deliberately not updatable here — it is the immutable identity assigned at
// creation, the same way Student's admissionNumber is immutable post-admission.
export const updateEmployeeSchema = z.object({
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  employmentTypeId: z.string().uuid().optional(),
  reportingManagerId: z.string().uuid().nullable().optional(),
  joiningDate: z.coerce.date().optional(),
  confirmationDate: z.coerce.date().nullable().optional(),
  employmentStatus: employmentStatusSchema.optional(),
  qualification: z.string().trim().max(200).nullable().optional(),
  experienceYears: z.number().int().min(0).max(80).nullable().optional(),
  emergencyContactName: z.string().trim().max(200).nullable().optional(),
  emergencyContactPhone: z.string().trim().max(30).nullable().optional(),
  emergencyContactRelation: z.string().trim().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateEmployeeServiceInput = z.infer<typeof updateEmployeeSchema>;

// Employee Portal self-service update (Phase 13 spec §9) — a deliberately narrow subset of
// updateEmployeeSchema: department/designation/employmentType/salary/employmentStatus are
// HR-managed only and must never be reachable through this schema. An employee's own update
// request is validated against this schema, then forwarded to the existing `updateEmployee`
// repository call — restriction by construction, not by stripping fields after the fact.
export const updateMyPersonalInfoSchema = z.object({
  qualification: z.string().trim().max(200).nullable().optional(),
  emergencyContactName: z.string().trim().max(200).nullable().optional(),
  emergencyContactPhone: z.string().trim().max(30).nullable().optional(),
  emergencyContactRelation: z.string().trim().max(100).nullable().optional(),
});
export type UpdateMyPersonalInfoServiceInput = z.infer<typeof updateMyPersonalInfoSchema>;

export const listEmployeesSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  departmentId: z.string().uuid().optional(),
  employmentStatus: employmentStatusSchema.optional(),
  search: z.string().trim().min(1).optional(),
});
export type ListEmployeesServiceInput = z.infer<typeof listEmployeesSchema>;

// Basic joined display shape — Employee's own HR fields plus the identity fields that live on
// UserProfile (never duplicated onto Employee itself), mirroring TeacherDTO's exact shape.
export interface EmployeeDTO {
  id: string;
  userProfileId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  schoolId: string;
  departmentId: string;
  designationId: string;
  employmentTypeId: string;
  reportingManagerId: string | null;
  employeeCode: string;
  joiningDate: Date;
  confirmationDate: Date | null;
  employmentStatus: EmploymentStatusValue;
  qualification: string | null;
  experienceYears: number | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  isActive: boolean;
}

export interface EmployeeListResultDTO {
  items: EmployeeDTO[];
  total: number;
  page: number;
  pageSize: number;
}

// Section 2 of the Phase 13 spec — the full "Employee Profile" read model: Employee fields +
// UserProfile identity + Department/Designation/EmploymentType names + reporting manager's name
// (if any) + bank-detail-on-file presence + document count.
export interface EmployeeProfileDTO extends EmployeeDTO {
  departmentName: string;
  designationName: string;
  employmentTypeName: string;
  reportingManagerName: string | null;
  hasBankDetail: boolean;
  documentCount: number;
}

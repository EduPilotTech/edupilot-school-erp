import { z } from "zod";

// --- LeaveType (lookup table) ------------------------------------------------------------------

export const createLeaveTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  code: z.string().trim().min(1, "Code is required."),
  maxDaysPerYear: z.number().int().min(0, "Max days per year must be zero or more."),
  carryForwardAllowed: z.boolean().optional(),
  carryForwardMaxDays: z.number().int().min(0).optional(),
});
export type CreateLeaveTypeServiceInput = z.infer<typeof createLeaveTypeSchema>;

export const updateLeaveTypeSchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  maxDaysPerYear: z.number().int().min(0).optional(),
  carryForwardAllowed: z.boolean().optional(),
  carryForwardMaxDays: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateLeaveTypeServiceInput = z.infer<typeof updateLeaveTypeSchema>;

export interface LeaveTypeDTO {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  maxDaysPerYear: number;
  carryForwardAllowed: boolean;
  carryForwardMaxDays: number | null;
  isActive: boolean;
}

// --- EmployeeLeaveBalance ------------------------------------------------------------------------

export const allocateLeaveBalanceSchema = z.object({
  employeeId: z.string().uuid("Invalid employee id."),
  leaveTypeId: z.string().uuid("Invalid leave type id."),
  year: z.number().int().min(2000).max(2100),
  allocatedDays: z.number().min(0, "Allocated days must be zero or more."),
  carriedForwardDays: z.number().min(0).optional(),
});
export type AllocateLeaveBalanceServiceInput = z.infer<typeof allocateLeaveBalanceSchema>;

export const getLeaveBalancesSchema = z.object({
  employeeId: z.string().uuid("Invalid employee id."),
  year: z.number().int().min(2000).max(2100),
});
export type GetLeaveBalancesServiceInput = z.infer<typeof getLeaveBalancesSchema>;

export interface EmployeeLeaveBalanceDTO {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  carriedForwardDays: number;
  availableDays: number;
}

// --- EmployeeLeaveRequest ------------------------------------------------------------------------

const leaveRequestStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]);

export const applyForLeaveSchema = z.object({
  employeeId: z.string().uuid("Invalid employee id."),
  leaveTypeId: z.string().uuid("Invalid leave type id."),
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
  isHalfDay: z.boolean().optional(),
  reason: z.string().trim().min(1, "A reason is required.").max(1000),
});
export type ApplyForLeaveServiceInput = z.infer<typeof applyForLeaveSchema>;

export const rejectEmployeeLeaveSchema = z.object({
  rejectionReason: z.string().trim().min(1, "A rejection reason is required.").max(1000),
});
export type RejectEmployeeLeaveServiceInput = z.infer<typeof rejectEmployeeLeaveSchema>;

export const listEmployeeLeaveRequestsSchema = z.object({
  employeeId: z.string().uuid().optional(),
  status: leaveRequestStatusSchema.optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});
export type ListEmployeeLeaveRequestsServiceInput = z.infer<typeof listEmployeeLeaveRequestsSchema>;

export interface EmployeeLeaveRequestDTO {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  isHalfDay: boolean;
  totalDays: number;
  reason: string;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
}

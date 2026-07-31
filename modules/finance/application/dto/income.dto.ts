import { z } from "zod";

export const createIncomeSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  incomeCategoryId: z.string().uuid("Income category is required."),
  financeAccountId: z.string().uuid("Finance account is required."),
  amount: z.number().positive("Amount must be greater than zero."),
  date: z.coerce.date({ message: "A valid date is required." }),
  description: z.string().trim().max(1000).optional(),
  referenceNo: z.string().trim().max(100).optional(),
  collectedBy: z.string().uuid().optional(),
});
export type CreateIncomeServiceInput = z.infer<typeof createIncomeSchema>;

export const updateIncomeSchema = z.object({
  academicSessionId: z.string().uuid().optional(),
  incomeCategoryId: z.string().uuid().optional(),
  financeAccountId: z.string().uuid().optional(),
  amount: z.number().positive("Amount must be greater than zero.").optional(),
  date: z.coerce.date().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  referenceNo: z.string().trim().max(100).nullable().optional(),
  collectedBy: z.string().uuid().nullable().optional(),
});
export type UpdateIncomeServiceInput = z.infer<typeof updateIncomeSchema>;

export interface IncomeDTO {
  id: string;
  schoolId: string;
  academicSessionId: string;
  incomeCategoryId: string;
  financeAccountId: string;
  amount: number;
  date: string;
  description: string | null;
  referenceNo: string | null;
  collectedBy: string | null;
}

export interface IncomeListFilterInput {
  page?: number;
  pageSize?: number;
  academicSessionId?: string;
  incomeCategoryId?: string;
  financeAccountId?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

export interface IncomeListResultDTO {
  items: IncomeDTO[];
  total: number;
  page: number;
  pageSize: number;
}

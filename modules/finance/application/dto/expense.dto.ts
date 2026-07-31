import { z } from "zod";

const financePaymentModeEnum = z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "UPI", "CARD", "OTHER"]);

export const createExpenseSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  expenseCategoryId: z.string().uuid("Expense category is required."),
  financeAccountId: z.string().uuid("Finance account is required."),
  amount: z.number().positive("Amount must be greater than zero."),
  date: z.coerce.date({ message: "A valid date is required." }),
  vendor: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  paymentMode: financePaymentModeEnum,
  referenceNo: z.string().trim().max(100).optional(),
});
export type CreateExpenseServiceInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = z.object({
  academicSessionId: z.string().uuid().optional(),
  expenseCategoryId: z.string().uuid().optional(),
  financeAccountId: z.string().uuid().optional(),
  amount: z.number().positive("Amount must be greater than zero.").optional(),
  date: z.coerce.date().optional(),
  vendor: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  paymentMode: financePaymentModeEnum.optional(),
  referenceNo: z.string().trim().max(100).nullable().optional(),
});
export type UpdateExpenseServiceInput = z.infer<typeof updateExpenseSchema>;

export interface ExpenseDTO {
  id: string;
  schoolId: string;
  academicSessionId: string;
  expenseCategoryId: string;
  financeAccountId: string;
  amount: number;
  date: string;
  vendor: string | null;
  description: string | null;
  paymentMode: z.infer<typeof financePaymentModeEnum>;
  referenceNo: string | null;
}

export interface ExpenseListFilterInput {
  page?: number;
  pageSize?: number;
  academicSessionId?: string;
  expenseCategoryId?: string;
  financeAccountId?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

export interface ExpenseListResultDTO {
  items: ExpenseDTO[];
  total: number;
  page: number;
  pageSize: number;
}

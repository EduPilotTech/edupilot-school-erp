import { z } from "zod";

const financeAccountTypeEnum = z.enum(["CASH", "BANK"]);

export const createFinanceAccountSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  accountType: financeAccountTypeEnum,
  openingBalance: z.number().min(0, "Opening balance cannot be negative.").default(0),
  isDefault: z.boolean().default(false),
});
export type CreateFinanceAccountServiceInput = z.infer<typeof createFinanceAccountSchema>;

// openingBalance/currentBalance are deliberately absent — immutable-after-creation and
// system-maintained respectively (see FinanceAccountEntity's own comment).
export const updateFinanceAccountSchema = z.object({
  name: z.string().trim().min(1).optional(),
  accountType: financeAccountTypeEnum.optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateFinanceAccountServiceInput = z.infer<typeof updateFinanceAccountSchema>;

export interface FinanceAccountDTO {
  id: string;
  schoolId: string;
  name: string;
  accountType: z.infer<typeof financeAccountTypeEnum>;
  openingBalance: number;
  currentBalance: number;
  isDefault: boolean;
  isActive: boolean;
}

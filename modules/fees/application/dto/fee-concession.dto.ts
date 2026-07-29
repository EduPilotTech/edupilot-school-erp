import { z } from "zod";
import type { FeeConcessionTypeValue, FeeConcessionValueTypeValue } from "../../domain/fee-concession.entity";

const concessionTypeEnum = z.enum(["DISCOUNT", "SCHOLARSHIP", "CONCESSION", "WAIVER", "SIBLING", "STAFF_WARD", "OTHER"]);
const concessionValueTypeEnum = z.enum(["PERCENTAGE", "FIXED_AMOUNT"]);

export const applyConcessionSchema = z
  .object({
    studentId: z.string().uuid("Student is required."),
    academicSessionId: z.string().uuid("Academic session is required."),
    feeCategoryId: z.string().uuid().optional(),
    type: concessionTypeEnum,
    valueType: concessionValueTypeEnum,
    value: z.number().positive("Value must be greater than zero."),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.valueType !== "PERCENTAGE" || data.value <= 100, {
    message: "A percentage concession cannot exceed 100%.",
    path: ["value"],
  });
export type ApplyConcessionServiceInput = z.infer<typeof applyConcessionSchema>;

export interface FeeConcessionDTO {
  id: string;
  studentId: string;
  academicSessionId: string;
  feeCategoryId: string | null;
  type: FeeConcessionTypeValue;
  valueType: FeeConcessionValueTypeValue;
  value: number;
  reason: string | null;
  isActive: boolean;
}

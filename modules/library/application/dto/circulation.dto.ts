import { z } from "zod";

const memberTypeEnum = z.enum(["STUDENT", "TEACHER", "STAFF"]);

export const issueBookSchema = z.object({
  bookCopyId: z.string().uuid("Book copy is required."),
  memberType: memberTypeEnum,
  memberId: z.string().uuid("Member is required."),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
});
export type IssueBookServiceInput = z.infer<typeof issueBookSchema>;

export const renewBookIssueSchema = z.object({
  newDueDate: z.coerce.date().optional(),
});
export type RenewBookIssueServiceInput = z.infer<typeof renewBookIssueSchema>;

export const returnBookSchema = z.object({
  returnDate: z.coerce.date(),
});
export type ReturnBookServiceInput = z.infer<typeof returnBookSchema>;

export const markBookLostSchema = z.object({
  reportedDate: z.coerce.date(),
});
export type MarkBookLostServiceInput = z.infer<typeof markBookLostSchema>;

export const markBookDamagedSchema = z.object({
  reportedDate: z.coerce.date(),
});
export type MarkBookDamagedServiceInput = z.infer<typeof markBookDamagedSchema>;

export const waiveBookIssueFineSchema = z.object({
  reason: z.string().trim().min(1, "A reason is required.").max(1000),
});
export type WaiveBookIssueFineServiceInput = z.infer<typeof waiveBookIssueFineSchema>;

export interface BookIssueDTO {
  id: string;
  bookCopyId: string;
  libraryId: string;
  memberType: z.infer<typeof memberTypeEnum>;
  memberId: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: "ISSUED" | "RETURNED" | "LOST" | "DAMAGED";
  renewalCount: number;
  issuedBy: string | null;
  returnedBy: string | null;
  fineWaived: boolean;
  fineWaivedReason: string | null;
}

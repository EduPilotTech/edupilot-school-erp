import { z } from "zod";

const leaveTypeEnum = z.enum(["REGULAR", "EMERGENCY", "WEEKEND"]);

export const requestHostelLeaveSchema = z.object({
  studentId: z.string().uuid("Student is required."),
  academicSessionId: z.string().uuid("Academic session is required."),
  leaveType: leaveTypeEnum,
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
  reason: z.string().trim().min(1, "A reason is required.").max(1000),
});
export type RequestHostelLeaveServiceInput = z.infer<typeof requestHostelLeaveSchema>;

export const rejectHostelLeaveSchema = z.object({
  rejectionReason: z.string().trim().min(1, "A rejection reason is required.").max(1000),
});
export type RejectHostelLeaveServiceInput = z.infer<typeof rejectHostelLeaveSchema>;

export const recordHostelLeaveReturnSchema = z.object({
  actualReturnDate: z.coerce.date(),
});
export type RecordHostelLeaveReturnServiceInput = z.infer<typeof recordHostelLeaveReturnSchema>;

export interface HostelLeaveRequestDTO {
  id: string;
  studentId: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  actualReturnDate: string | null;
}

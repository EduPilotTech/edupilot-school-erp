import type { Prisma } from "@/lib/generated/prisma/client";
import type { HomeworkStatusEntity, HomeworkStatusValue } from "./homework-status.entity";

export interface SetHomeworkStatusInput {
  tenantId: string;
  homeworkId: string;
  studentId: string;
  status: HomeworkStatusValue;
  updatedBy?: string | null;
}

// Upsert-corrected on the natural key (homeworkId, studentId) — same shape as
// StudentAttendance.markOne — a status change is never a new row.
export interface HomeworkStatusRepository {
  findByHomework(tenantId: string, homeworkId: string): Promise<HomeworkStatusEntity[]>;
  findByStudent(tenantId: string, studentId: string): Promise<HomeworkStatusEntity[]>;
  findByHomeworkAndStudent(
    tenantId: string,
    homeworkId: string,
    studentId: string
  ): Promise<HomeworkStatusEntity | null>;
  upsert(input: SetHomeworkStatusInput, tx?: Prisma.TransactionClient): Promise<HomeworkStatusEntity>;
}

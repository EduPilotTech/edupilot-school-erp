import type { Prisma } from "@/lib/generated/prisma/client";
import type { HomeworkEntity } from "./homework.entity";

export interface CreateHomeworkInput {
  tenantId: string;
  academicSessionId: string;
  classId: string;
  sectionId?: string | null;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  assignedDate: Date;
  dueDate: Date;
  attachmentKey?: string | null;
  createdBy?: string | null;
}

export interface UpdateHomeworkInput {
  title?: string;
  description?: string;
  dueDate?: Date;
  attachmentKey?: string | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface HomeworkRepository {
  findById(tenantId: string, id: string): Promise<HomeworkEntity | null>;

  // A student's homework list must include both class-wide (`sectionId = null`) and their own
  // section's homework — the caller passes the student's sectionId and this returns the union.
  findByClass(tenantId: string, classId: string, sectionId?: string | null): Promise<HomeworkEntity[]>;

  findByTeacher(tenantId: string, teacherId: string): Promise<HomeworkEntity[]>;

  create(input: CreateHomeworkInput, tx?: Prisma.TransactionClient): Promise<HomeworkEntity>;
  update(tenantId: string, id: string, input: UpdateHomeworkInput): Promise<HomeworkEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HomeworkEntity>;
}

import type { Prisma } from "@/lib/generated/prisma/client";
import type { MessageThreadEntity } from "./message-thread.entity";

export interface CreateMessageThreadInput {
  tenantId: string;
  studentId: string;
  guardianId: string;
  teacherId: string;
  subject?: string | null;
}

export interface MessageThreadRepository {
  findById(tenantId: string, id: string): Promise<MessageThreadEntity | null>;

  // The natural key — send-message.service.ts finds-or-creates on this triple, never creating a
  // duplicate thread for the same student+guardian+teacher.
  findByTriple(
    tenantId: string,
    studentId: string,
    guardianId: string,
    teacherId: string
  ): Promise<MessageThreadEntity | null>;

  findByGuardian(tenantId: string, guardianId: string): Promise<MessageThreadEntity[]>;
  findByTeacher(tenantId: string, teacherId: string): Promise<MessageThreadEntity[]>;

  create(input: CreateMessageThreadInput, tx?: Prisma.TransactionClient): Promise<MessageThreadEntity>;
}

// One thread per (student, guardian, teacher) triple — Parent <-> Teacher Messaging
// (requirement 17). No `deletedAt` — a thread is deactivated (`isActive`), never removed.
export interface MessageThreadEntity {
  id: string;
  tenantId: string;
  studentId: string;
  guardianId: string;
  teacherId: string;
  subject: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

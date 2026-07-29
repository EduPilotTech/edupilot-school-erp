// No `deletedAt` — see prisma/schema.prisma's TeacherAssignment comment: this is a relationship
// record (same category as Enrollment/StudentAttendance), not master data. "Unassign" is
// `isActive: false` on the existing row via upsert, never a new row.
export interface TeacherAssignmentEntity {
  id: string;
  tenantId: string;
  teacherId: string;
  subjectId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

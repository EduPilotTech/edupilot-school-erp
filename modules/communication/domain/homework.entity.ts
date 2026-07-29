// View-only this phase (Phase 9 Decision 3) — teacher-authored, no student file-upload
// submission workflow. `sectionId` nullable = the whole class, mirroring Holiday/WorkingDay's
// own "session-wide unless scoped narrower" shape.
export interface HomeworkEntity {
  id: string;
  tenantId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string | null;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  assignedDate: Date;
  dueDate: Date;
  attachmentKey: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

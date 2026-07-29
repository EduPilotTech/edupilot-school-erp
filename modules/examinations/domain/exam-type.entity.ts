// Domain view of ExamType, decoupled from Prisma's generated type — same reasoning as
// modules/academics' entity files (docs/CODING_STANDARDS.md §6).
export interface ExamTypeEntity {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

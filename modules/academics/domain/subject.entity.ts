// Domain view of Subject, decoupled from Prisma's generated type — same reasoning as
// modules/academics' other entity files (docs/CODING_STANDARDS.md §6: repositories return
// domain entities, never raw Prisma models).
export interface SubjectEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

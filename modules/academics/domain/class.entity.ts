// Domain view of Class, decoupled from Prisma's generated type — same reasoning as
// modules/users' entity files (docs/CODING_STANDARDS.md §6: repositories return domain
// entities, never raw Prisma models).
export interface ClassEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  academicSessionId: string;
  name: string;
  grade: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

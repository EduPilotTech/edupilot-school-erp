import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, Student as PrismaStudent } from "@/lib/generated/prisma/client";
import type {
  CreateStudentInput,
  StudentListFilter,
  StudentListResult,
  StudentRepository,
  UpdateStudentInput,
} from "../domain/student.repository";
import type {
  GenderValue,
  StudentEntity,
  StudentListItemEntity,
  StudentProfileEntity,
  StudentStatusValue,
} from "../domain/student.entity";
import type { GuardianRelationshipValue } from "../domain/student-guardian.repository";
import type { EnrollmentStatusValue } from "../domain/enrollment.entity";

function toEntity(row: PrismaStudent): StudentEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    admissionNumber: row.admissionNumber,
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender as GenderValue | null,
    photoUrl: row.photoUrl,
    address: row.address,
    city: row.city,
    state: row.state,
    country: row.country,
    postalCode: row.postalCode,
    admissionDate: row.admissionDate,
    status: row.status as StudentStatusValue,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

// Sprint 4 — Step 5: a targeted `select` (not `include`) for the Student List — pulls only the
// columns the list view renders, plus the student's *current* Enrollment (endDate IS NULL) and
// *primary* StudentGuardian, each capped with `take: 1` so Prisma issues one query per relation
// per page (not one row multiplied out per historical enrollment/guardian). Reused for both the
// `findMany` and its `count` sibling's `where` — `count` ignores `select` but shares the same
// relation-filter shapes.
const studentListSelect = {
  id: true,
  tenantId: true,
  admissionNumber: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  gender: true,
  photoUrl: true,
  address: true,
  city: true,
  state: true,
  country: true,
  postalCode: true,
  admissionDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdBy: true,
  updatedBy: true,
  enrollments: {
    where: { endDate: null },
    take: 1,
    select: {
      rollNumber: true,
      academicSession: { select: { sessionName: true } },
      class: { select: { name: true } },
      section: { select: { name: true } },
    },
  },
  studentGuardians: {
    where: { isPrimary: true },
    take: 1,
    select: {
      guardian: { select: { fullName: true, phone: true } },
    },
  },
} satisfies Prisma.StudentSelect;

type StudentListRow = Prisma.StudentGetPayload<{ select: typeof studentListSelect }>;

function toListItemEntity(row: StudentListRow): StudentListItemEntity {
  const currentEnrollment = row.enrollments[0];
  const primaryGuardian = row.studentGuardians[0]?.guardian;

  return {
    id: row.id,
    tenantId: row.tenantId,
    admissionNumber: row.admissionNumber,
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender as GenderValue | null,
    photoUrl: row.photoUrl,
    address: row.address,
    city: row.city,
    state: row.state,
    country: row.country,
    postalCode: row.postalCode,
    admissionDate: row.admissionDate,
    status: row.status as StudentStatusValue,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    currentAcademicSessionName: currentEnrollment?.academicSession.sessionName ?? null,
    currentClassName: currentEnrollment?.class.name ?? null,
    currentSectionName: currentEnrollment?.section.name ?? null,
    currentRollNumber: currentEnrollment?.rollNumber ?? null,
    primaryGuardianName: primaryGuardian?.fullName ?? null,
    primaryGuardianPhone: primaryGuardian?.phone ?? null,
  };
}

// `sortBy: "name"` sorts by firstName then lastName — Student has no single "name" column.
function toOrderBy(
  sortBy: StudentListFilter["sortBy"],
  sortDirection: StudentListFilter["sortDirection"]
): Prisma.StudentOrderByWithRelationInput | Prisma.StudentOrderByWithRelationInput[] {
  const direction = sortDirection ?? "asc";
  switch (sortBy) {
    case "admissionNumber":
      return { admissionNumber: direction };
    case "admissionDate":
      return { admissionDate: direction };
    case "name":
    default:
      return [{ firstName: direction }, { lastName: direction }];
  }
}

// Sprint 4 — Step 6: a targeted `select` for the Student Profile page — the whole profile
// (Student columns + every Guardian + every Enrollment, each with its related names) in ONE
// query. Unlike `studentListSelect` above, nothing is capped with `take: 1` here: the profile
// page genuinely needs the full guardian list and the full enrollment history, not just the
// "current"/"primary" one.
const studentProfileSelect = {
  id: true,
  tenantId: true,
  admissionNumber: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  gender: true,
  photoUrl: true,
  address: true,
  city: true,
  state: true,
  country: true,
  postalCode: true,
  admissionDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdBy: true,
  updatedBy: true,
  studentGuardians: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      relationship: true,
      isPrimary: true,
      guardian: { select: { fullName: true, occupation: true, phone: true } },
    },
  },
  enrollments: {
    orderBy: { startDate: "desc" as const },
    select: {
      id: true,
      rollNumber: true,
      startDate: true,
      endDate: true,
      status: true,
      academicSession: { select: { sessionName: true } },
      class: { select: { name: true } },
      section: { select: { name: true } },
    },
  },
} satisfies Prisma.StudentSelect;

type StudentProfileRow = Prisma.StudentGetPayload<{ select: typeof studentProfileSelect }>;

function toProfileEntity(row: StudentProfileRow): StudentProfileEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    admissionNumber: row.admissionNumber,
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender as GenderValue | null,
    photoUrl: row.photoUrl,
    address: row.address,
    city: row.city,
    state: row.state,
    country: row.country,
    postalCode: row.postalCode,
    admissionDate: row.admissionDate,
    status: row.status as StudentStatusValue,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    guardians: row.studentGuardians.map((sg) => ({
      id: sg.id,
      relationship: sg.relationship as GuardianRelationshipValue,
      isPrimary: sg.isPrimary,
      fullName: sg.guardian.fullName,
      occupation: sg.guardian.occupation,
      phone: sg.guardian.phone,
    })),
    enrollments: row.enrollments.map((enrollment) => ({
      id: enrollment.id,
      academicSessionName: enrollment.academicSession.sessionName,
      className: enrollment.class.name,
      sectionName: enrollment.section.name,
      rollNumber: enrollment.rollNumber,
      startDate: enrollment.startDate,
      endDate: enrollment.endDate,
      status: enrollment.status as EnrollmentStatusValue,
    })),
  };
}

// Every tenant-scoped lookup/write uses the `tenantId_id` / `tenantId_admissionNumber` compound
// uniques rather than a bare `where: { id }`, matching the established pattern from
// modules/users' repositories.
export class PrismaStudentRepository implements StudentRepository {
  async findById(tenantId: string, id: string): Promise<StudentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.student.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByAdmissionNumber(
    tenantId: string,
    admissionNumber: string
  ): Promise<StudentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.student.findUnique({ where: { tenantId_admissionNumber: { tenantId, admissionNumber } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter: StudentListFilter): Promise<StudentListResult> {
    return withTenantContext(tenantId, async (tx) => {
      // Excludes soft-deleted students by default — matching every other list method in this
      // codebase (PrismaClassRepository.findMany, PrismaSectionRepository.findMany). The
      // original Sprint 4 — Step 4 findMany didn't filter `deletedAt` at all, since nothing
      // called it yet; fixed here as part of making this a real, production list.
      const hasEnrollmentFilter = !!(
        filter.academicSessionId ||
        filter.classId ||
        filter.sectionId
      );

      const where = {
        tenantId,
        deletedAt: null,
        ...(filter.search
          ? {
              OR: [
                { admissionNumber: { contains: filter.search, mode: "insensitive" as const } },
                { firstName: { contains: filter.search, mode: "insensitive" as const } },
                { lastName: { contains: filter.search, mode: "insensitive" as const } },
                {
                  studentGuardians: {
                    some: {
                      guardian: {
                        OR: [
                          { fullName: { contains: filter.search, mode: "insensitive" as const } },
                          { phone: { contains: filter.search, mode: "insensitive" as const } },
                        ],
                      },
                    },
                  },
                },
              ],
            }
          : {}),
        ...(filter.status ? { status: filter.status } : {}),
        // Filters by the student's *current* enrollment (endDate IS NULL) — a student who was
        // in this class/section/session historically but has since moved on doesn't match.
        ...(hasEnrollmentFilter
          ? {
              enrollments: {
                some: {
                  endDate: null,
                  ...(filter.academicSessionId
                    ? { academicSessionId: filter.academicSessionId }
                    : {}),
                  ...(filter.classId ? { classId: filter.classId } : {}),
                  ...(filter.sectionId ? { sectionId: filter.sectionId } : {}),
                },
              },
            }
          : {}),
      };

      const [rows, total] = await Promise.all([
        tx.student.findMany({
          where,
          select: studentListSelect,
          orderBy: toOrderBy(filter.sortBy, filter.sortDirection),
          skip: (filter.page - 1) * filter.pageSize,
          take: filter.pageSize,
        }),
        tx.student.count({ where }),
      ]);

      return {
        items: rows.map(toListItemEntity),
        total,
        page: filter.page,
        pageSize: filter.pageSize,
      };
    });
  }

  async findProfileById(tenantId: string, id: string): Promise<StudentProfileEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.student.findUnique({
        where: { tenantId_id: { tenantId, id } },
        select: studentProfileSelect,
      })
    );
    return row ? toProfileEntity(row) : null;
  }

  async create(input: CreateStudentInput, tx?: Prisma.TransactionClient): Promise<StudentEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (t) =>
        t.student.create({
          data: {
            tenantId: input.tenantId,
            admissionNumber: input.admissionNumber,
            firstName: input.firstName,
            lastName: input.lastName,
            dateOfBirth: input.dateOfBirth,
            gender: input.gender ?? null,
            photoUrl: input.photoUrl ?? null,
            address: input.address ?? null,
            city: input.city ?? null,
            state: input.state ?? null,
            country: input.country ?? null,
            postalCode: input.postalCode ?? null,
            admissionDate: input.admissionDate,
            createdBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateStudentInput,
    tx?: Prisma.TransactionClient
  ): Promise<StudentEntity> {
    const row = await withTenantContext(
      tenantId,
      (t) =>
        t.student.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            firstName: input.firstName,
            lastName: input.lastName,
            dateOfBirth: input.dateOfBirth,
            gender: input.gender,
            photoUrl: input.photoUrl,
            address: input.address,
            city: input.city,
            state: input.state,
            country: input.country,
            postalCode: input.postalCode,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: StudentStatusValue,
    updatedBy: string | null
  ): Promise<StudentEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.student.update({
        where: { tenantId_id: { tenantId, id } },
        data: { status, updatedBy },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<StudentEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.student.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }

  async restore(tenantId: string, id: string, updatedBy: string | null): Promise<StudentEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.student.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: null, updatedBy },
      })
    );
    return toEntity(row);
  }
}

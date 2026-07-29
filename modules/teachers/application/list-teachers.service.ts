import "server-only";
import { getUserDetail } from "@/modules/users/application/get-user-detail.service";
import { PrismaTeacherRepository } from "../infrastructure/prisma-teacher.repository";
import type { TeacherDTO } from "./dto/teacher.dto";

// Read-only, unpaginated — a school's teacher list is small, matching listSubjects/listClassrooms'
// own "not paginated" reasoning. Joins each Teacher row with its UserProfile via the existing
// modules/users application service (never modules/users/infrastructure directly, per
// docs/PROJECT_ARCHITECTURE.md §6's module-boundary rule).
export async function listTeachers(context: { tenantId: string }): Promise<TeacherDTO[]> {
  const repository = new PrismaTeacherRepository();
  const result = await repository.findMany(context.tenantId, { page: 1, pageSize: 200 });

  const dtos = await Promise.all(
    result.items.map(async (teacher): Promise<TeacherDTO | null> => {
      const userDetail = await getUserDetail(teacher.userProfileId, { tenantId: context.tenantId });
      if (!userDetail) {
        return null;
      }
      return {
        id: teacher.id,
        userProfileId: teacher.userProfileId,
        fullName: userDetail.profile.fullName,
        email: userDetail.profile.email,
        phone: userDetail.profile.phone,
        employeeCode: teacher.employeeCode,
        joiningDate: teacher.joiningDate,
        qualification: teacher.qualification,
        isActive: teacher.isActive,
      };
    })
  );

  return dtos.filter((dto): dto is TeacherDTO => dto !== null);
}

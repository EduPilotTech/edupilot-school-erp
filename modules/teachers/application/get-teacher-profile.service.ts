import "server-only";
import { getUserDetail } from "@/modules/users/application/get-user-detail.service";
import { PrismaTeacherRepository } from "../infrastructure/prisma-teacher.repository";
import { TeacherNotFoundError } from "../domain/errors";
import type { TeacherDTO } from "./dto/teacher.dto";

export async function getTeacherProfile(teacherId: string, context: { tenantId: string }): Promise<TeacherDTO> {
  const repository = new PrismaTeacherRepository();
  const teacher = await repository.findById(context.tenantId, teacherId);
  if (!teacher || teacher.deletedAt !== null) {
    throw new TeacherNotFoundError();
  }

  const userDetail = await getUserDetail(teacher.userProfileId, { tenantId: context.tenantId });
  if (!userDetail) {
    throw new TeacherNotFoundError();
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
}

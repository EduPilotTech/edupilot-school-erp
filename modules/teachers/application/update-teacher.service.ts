import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { getUserDetail } from "@/modules/users/application/get-user-detail.service";
import { PrismaTeacherRepository } from "../infrastructure/prisma-teacher.repository";
import { TeacherAlreadyExistsError, TeacherNotFoundError } from "../domain/errors";
import { updateTeacherSchema, type TeacherDTO } from "./dto/teacher.dto";

export interface UpdateTeacherContext {
  tenantId: string;
  actingUserId: string;
}

export async function updateTeacher(
  teacherId: string,
  input: unknown,
  context: UpdateTeacherContext
): Promise<TeacherDTO> {
  const parsed = updateTeacherSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid teacher data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaTeacherRepository();
  const existing = await repository.findById(tenantId, teacherId);
  if (!existing || existing.deletedAt !== null) {
    throw new TeacherNotFoundError();
  }

  let teacher;
  try {
    teacher = await repository.update(tenantId, teacherId, {
      employeeCode: data.employeeCode,
      joiningDate: data.joiningDate,
      qualification: data.qualification,
      isActive: data.isActive,
      updatedBy: actingUserId,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new TeacherAlreadyExistsError("This employee code is already in use.");
    }
    throw error;
  }

  const userDetail = await getUserDetail(teacher.userProfileId, { tenantId });
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

import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { getUserDetail } from "@/modules/users/application/get-user-detail.service";
import { PrismaTeacherRepository } from "../infrastructure/prisma-teacher.repository";
import { TeacherAlreadyExistsError, TeacherNotFoundError, TeacherRoleRequiredError } from "../domain/errors";
import { createTeacherSchema, type TeacherDTO } from "./dto/teacher.dto";

export interface CreateTeacherContext {
  tenantId: string;
  actingUserId: string;
}

const TEACHER_ROLE_CODES = new Set(["TEACHER", "CLASS_TEACHER"]);

// Promotes an existing UserProfile into a Teacher record — never creates a new UserProfile
// (Phase 6 Decision 1: UserProfile remains the identity, Teacher is a 1:1 extension). The
// UserProfile must already hold the TEACHER or CLASS_TEACHER role, assigned via the existing
// modules/users role-assignment flow, before it can be promoted.
export async function createTeacher(input: unknown, context: CreateTeacherContext): Promise<TeacherDTO> {
  const parsed = createTeacherSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid teacher data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const userDetail = await getUserDetail(data.userProfileId, { tenantId });
  if (!userDetail || userDetail.profile.deletedAt !== null) {
    throw new TeacherNotFoundError("User not found.");
  }
  const hasTeacherRole = userDetail.roles.some(
    (assignment) => assignment.roleCode !== null && TEACHER_ROLE_CODES.has(assignment.roleCode)
  );
  if (!hasTeacherRole) {
    throw new TeacherRoleRequiredError();
  }

  const repository = new PrismaTeacherRepository();
  const existingByUser = await repository.findByUserProfileId(tenantId, data.userProfileId);
  if (existingByUser) {
    throw new TeacherAlreadyExistsError("This staff member already has a teacher record.");
  }
  const existingByCode = await repository.findByEmployeeCode(tenantId, data.employeeCode);
  if (existingByCode) {
    throw new TeacherAlreadyExistsError("This employee code is already in use.");
  }

  try {
    const teacher = await repository.create({
      tenantId,
      userProfileId: data.userProfileId,
      employeeCode: data.employeeCode,
      joiningDate: data.joiningDate,
      qualification: data.qualification ?? null,
      createdBy: actingUserId,
    });
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new TeacherAlreadyExistsError();
    }
    throw error;
  }
}

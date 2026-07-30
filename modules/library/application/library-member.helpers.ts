import "server-only";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaTeacherRepository } from "@/modules/teachers/infrastructure/prisma-teacher.repository";
import { PrismaUserProfileRepository } from "@/modules/users/infrastructure/prisma-user-profile.repository";
import { MemberNotFoundError } from "../domain/errors";
import type { LibraryMemberTypeValue } from "../domain/book-issue.entity";

// The polymorphic member reference (mirrors FeeLedgerEntry.referenceType/referenceId) resolves
// to a different table depending on `memberType` — there is no generic Staff table to reuse, so
// STAFF resolves directly against UserProfile (covers Admin/Accountant/Receptionist/Librarian/
// any non-teaching employee), TEACHER resolves against Teacher (not UserProfile directly, to
// stay consistent with how every other module references a teacher), and STUDENT resolves
// against Student.
export async function resolveMemberDisplayName(
  tenantId: string,
  memberType: LibraryMemberTypeValue,
  memberId: string
): Promise<string> {
  if (memberType === "STUDENT") {
    const repository = new PrismaStudentRepository();
    const student = await repository.findById(tenantId, memberId);
    if (!student || student.deletedAt !== null) throw new MemberNotFoundError();
    return `${student.firstName} ${student.lastName}`;
  }
  if (memberType === "TEACHER") {
    const repository = new PrismaTeacherRepository();
    const teacher = await repository.findById(tenantId, memberId);
    if (!teacher || teacher.deletedAt !== null) throw new MemberNotFoundError();
    const userProfileRepository = new PrismaUserProfileRepository();
    const userProfile = await userProfileRepository.findById(tenantId, teacher.userProfileId);
    if (!userProfile) throw new MemberNotFoundError();
    return userProfile.fullName;
  }
  const repository = new PrismaUserProfileRepository();
  const userProfile = await repository.findById(tenantId, memberId);
  if (!userProfile || userProfile.deletedAt !== null) throw new MemberNotFoundError();
  return userProfile.fullName;
}

export async function assertMemberExists(tenantId: string, memberType: LibraryMemberTypeValue, memberId: string): Promise<void> {
  await resolveMemberDisplayName(tenantId, memberType, memberId);
}

export { getMemberBorrowLimit } from "./library-borrow-limit.helpers";

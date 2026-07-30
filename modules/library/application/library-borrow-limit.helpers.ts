import type { LibraryMemberTypeValue } from "../domain/book-issue.entity";
import type { LibrarySettingsDTO } from "./dto/library.dto";

// Pure — deliberately kept out of library-member.helpers.ts (which imports "server-only" +
// Prisma repositories at module scope) so it can be unit-tested directly without a server-only
// guard tripping.
export function getMemberBorrowLimit(memberType: LibraryMemberTypeValue, settings: LibrarySettingsDTO): number {
  if (memberType === "STUDENT") return settings.maxBooksStudent;
  if (memberType === "TEACHER") return settings.maxBooksTeacher;
  return settings.maxBooksStaff;
}

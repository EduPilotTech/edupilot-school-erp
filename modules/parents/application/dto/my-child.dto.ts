import type { GuardianRelationshipValue } from "@/modules/students/domain/student-guardian.repository";

export interface MyChildDTO {
  studentId: string;
  relationship: GuardianRelationshipValue;
  isPrimary: boolean;
  fullName: string;
  admissionNumber: string;
  photoUrl: string | null;
}

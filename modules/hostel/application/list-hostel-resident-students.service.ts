import "server-only";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaStudentHostelAssignmentRepository } from "../infrastructure/prisma-student-hostel-assignment.repository";

export interface HostelResidentStudentDTO {
  id: string;
  admissionNumber: string;
  fullName: string;
}

// Every student with a current (checkOutDate IS NULL) hostel assignment this session — backs the
// student picker on Leave Management and Visitor Register, where the action only makes sense for
// a resident student.
export async function listHostelResidentStudents(
  tenantId: string,
  academicSessionId: string
): Promise<HostelResidentStudentDTO[]> {
  const assignmentRepository = new PrismaStudentHostelAssignmentRepository();
  const assignments = await assignmentRepository.findCurrentForAcademicSession(tenantId, academicSessionId);

  const studentRepository = new PrismaStudentRepository();
  const rows: HostelResidentStudentDTO[] = [];
  for (const assignment of assignments) {
    const student = await studentRepository.findById(tenantId, assignment.studentId);
    if (!student) continue;
    rows.push({
      id: student.id,
      admissionNumber: student.admissionNumber,
      fullName: `${student.firstName} ${student.lastName}`,
    });
  }

  rows.sort((a, b) => a.fullName.localeCompare(b.fullName));
  return rows;
}

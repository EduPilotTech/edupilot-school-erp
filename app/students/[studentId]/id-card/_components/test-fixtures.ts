import type { StudentIdCardDTO } from "@/modules/students/application/dto/student-id-card.dto";

export function makeIdCard(overrides: Partial<StudentIdCardDTO> = {}): StudentIdCardDTO {
  return {
    student: {
      id: "11111111-1111-4111-8111-111111111111",
      admissionNumber: "ADM202600001",
      fullName: "Jane Doe",
      dateOfBirth: new Date("2016-05-15"),
      gender: "FEMALE",
    },
    academic: {
      academicSessionName: "2026-2027",
      className: "Grade 5",
      sectionName: "A",
      rollNumber: "12",
    },
    photoUrl: null,
    qrValue: "11111111-1111-4111-8111-111111111111",
    school: {
      name: "EduPilot Demo School",
      logoUrl: null,
      address: "123 Test Street, Testville, Test State 123456",
      phone: "9999999999",
      email: "info@example.com",
    },
    ...overrides,
  };
}

import type { EmployeeLetterDocumentType } from "./dto/employee-document.dto";

// Pure — kept out of generate-employee-letter.service.ts (which imports "server-only" + jsPDF at
// module scope) so the letter copy can be unit-tested/reviewed independently, mirroring
// library-borrow-limit.helpers.ts's "pure logic kept separate from server-only files" pattern.
export interface EmployeeLetterTemplateInput {
  employeeName: string;
  employeeCode: string;
  designationName: string;
  departmentName: string;
  joiningDateText: string;
  effectiveDateText: string;
  relievingDateText: string | null;
  newDesignationName: string | null;
  remarks: string | null;
}

export interface EmployeeLetterContent {
  title: string;
  paragraphs: string[];
}

const LETTER_TITLES: Record<EmployeeLetterDocumentType, string> = {
  APPOINTMENT_LETTER: "Appointment Letter",
  JOINING_LETTER: "Joining Letter",
  PROMOTION_LETTER: "Promotion Letter",
  WARNING_LETTER: "Warning Letter",
  EXPERIENCE_CERTIFICATE: "Experience Certificate",
  RELIEVING_LETTER: "Relieving Letter",
};

export function buildEmployeeLetterContent(
  documentType: EmployeeLetterDocumentType,
  input: EmployeeLetterTemplateInput
): EmployeeLetterContent {
  const { employeeName, employeeCode, designationName, departmentName, joiningDateText, effectiveDateText, relievingDateText, newDesignationName, remarks } = input;

  switch (documentType) {
    case "APPOINTMENT_LETTER":
      return {
        title: LETTER_TITLES.APPOINTMENT_LETTER,
        paragraphs: [
          `Dear ${employeeName},`,
          `This is to confirm the appointment of ${employeeName} (Employee Code: ${employeeCode}) as ${designationName} in the ${departmentName} department, effective from ${effectiveDateText}.`,
          `We look forward to a mutually rewarding association and wish you every success in your new role.`,
        ],
      };
    case "JOINING_LETTER":
      return {
        title: LETTER_TITLES.JOINING_LETTER,
        paragraphs: [
          `Dear ${employeeName},`,
          `This is to confirm that ${employeeName} (Employee Code: ${employeeCode}) has joined as ${designationName} in the ${departmentName} department with effect from ${joiningDateText}.`,
          `We welcome you to the organization and wish you a successful tenure.`,
        ],
      };
    case "PROMOTION_LETTER":
      return {
        title: LETTER_TITLES.PROMOTION_LETTER,
        paragraphs: [
          `Dear ${employeeName},`,
          newDesignationName
            ? `We are pleased to inform you that, in recognition of your performance and contribution, you have been promoted from ${designationName} to ${newDesignationName} in the ${departmentName} department, effective from ${effectiveDateText}.`
            : `We are pleased to inform you that, in recognition of your performance and contribution, you have been promoted to a higher role in the ${departmentName} department, effective from ${effectiveDateText}.`,
          `Congratulations on this achievement. We are confident you will continue to excel in your new responsibilities.`,
        ],
      };
    case "WARNING_LETTER":
      return {
        title: LETTER_TITLES.WARNING_LETTER,
        paragraphs: [
          `Dear ${employeeName},`,
          `This letter serves as a formal warning regarding conduct/performance concerns brought to our notice, dated ${effectiveDateText}.${remarks ? ` ${remarks}` : ""}`,
          `You are advised to take corrective action immediately. Failure to improve may result in further disciplinary action, up to and including termination of employment, as per the organization's policies.`,
        ],
      };
    case "EXPERIENCE_CERTIFICATE":
      return {
        title: LETTER_TITLES.EXPERIENCE_CERTIFICATE,
        paragraphs: [
          `This is to certify that ${employeeName} (Employee Code: ${employeeCode}) worked with us as ${designationName} in the ${departmentName} department from ${joiningDateText} to ${relievingDateText ?? "present"}.`,
          `During this period, we found ${employeeName} to be sincere, hardworking, and dedicated to their responsibilities. We wish them success in all future endeavors.`,
        ],
      };
    case "RELIEVING_LETTER":
      return {
        title: LETTER_TITLES.RELIEVING_LETTER,
        paragraphs: [
          `Dear ${employeeName},`,
          `This is to confirm that you have been relieved from your duties as ${designationName} in the ${departmentName} department, with effect from ${relievingDateText ?? effectiveDateText}.`,
          `We thank you for your contribution during your tenure and wish you all the best in your future endeavors.`,
        ],
      };
    default: {
      const exhaustiveCheck: never = documentType;
      throw new Error(`Unsupported letter document type: ${String(exhaustiveCheck)}`);
    }
  }
}

import { describe, expect, it } from "vitest";
import {
  employeeDocumentUploadMetaSchema,
  generateEmployeeLetterSchema,
  uploadableEmployeeDocumentTypeSchema,
  employeeLetterDocumentTypeSchema,
} from "./employee-document.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("uploadableEmployeeDocumentTypeSchema", () => {
  it("accepts every uploadable type", () => {
    for (const type of ["PHOTO", "RESUME", "IDENTITY_PROOF", "BANK_PROOF", "MEDICAL_CERTIFICATE", "POLICE_VERIFICATION", "OTHER"]) {
      expect(uploadableEmployeeDocumentTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it("rejects a letter type", () => {
    expect(uploadableEmployeeDocumentTypeSchema.safeParse("APPOINTMENT_LETTER").success).toBe(false);
  });
});

describe("employeeLetterDocumentTypeSchema", () => {
  it("accepts every letter type", () => {
    for (const type of [
      "APPOINTMENT_LETTER",
      "JOINING_LETTER",
      "PROMOTION_LETTER",
      "WARNING_LETTER",
      "EXPERIENCE_CERTIFICATE",
      "RELIEVING_LETTER",
    ]) {
      expect(employeeLetterDocumentTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it("rejects an uploadable type", () => {
    expect(employeeLetterDocumentTypeSchema.safeParse("PHOTO").success).toBe(false);
  });
});

describe("employeeDocumentUploadMetaSchema", () => {
  it("accepts valid metadata", () => {
    const result = employeeDocumentUploadMetaSchema.safeParse({
      employeeId: VALID_UUID,
      documentType: "RESUME",
      originalFileName: "resume.pdf",
      mimeType: "application/pdf",
      fileSize: 1024,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a zero fileSize", () => {
    const result = employeeDocumentUploadMetaSchema.safeParse({
      employeeId: VALID_UUID,
      documentType: "RESUME",
      originalFileName: "resume.pdf",
      mimeType: "application/pdf",
      fileSize: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("generateEmployeeLetterSchema", () => {
  it("accepts a minimal Appointment Letter request", () => {
    const result = generateEmployeeLetterSchema.safeParse({
      employeeId: VALID_UUID,
      documentType: "APPOINTMENT_LETTER",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unsupported document type", () => {
    const result = generateEmployeeLetterSchema.safeParse({
      employeeId: VALID_UUID,
      documentType: "PHOTO",
    });
    expect(result.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { createNoticeSchema } from "./notice.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createNoticeSchema", () => {
  it("accepts an ALL-audience notice with no class/section", () => {
    const result = createNoticeSchema.safeParse({
      academicSessionId: VALID_UUID,
      title: "School closed Friday",
      body: "The school will be closed for a public holiday.",
      audience: "ALL",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a SECTION-audience notice with class and section set", () => {
    const result = createNoticeSchema.safeParse({
      academicSessionId: VALID_UUID,
      title: "Field trip permission slip",
      body: "Please return the signed slip by Monday.",
      audience: "SECTION",
      classId: VALID_UUID,
      sectionId: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty body", () => {
    const result = createNoticeSchema.safeParse({
      academicSessionId: VALID_UUID,
      title: "Untitled",
      body: "",
      audience: "ALL",
    });
    expect(result.success).toBe(false);
  });
});

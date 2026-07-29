import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IdCardBack } from "./id-card-back";
import { makeIdCard } from "./test-fixtures";

describe("IdCardBack", () => {
  it("renders a QR code encoding the student's UUID", () => {
    const card = makeIdCard();
    const { container } = render(<IdCardBack card={card} />);
    const qr = container.querySelector('[data-testid="id-card-qr-code"] svg');
    expect(qr).not.toBeNull();
  });

  it("renders the school's contact details", () => {
    render(<IdCardBack card={makeIdCard()} />);
    expect(screen.getByText("EduPilot Demo School")).toBeInTheDocument();
    expect(screen.getByText("123 Test Street, Testville, Test State 123456")).toBeInTheDocument();
    expect(screen.getByText("9999999999")).toBeInTheDocument();
    expect(screen.getByText("info@example.com")).toBeInTheDocument();
  });

  it("renders signature lines", () => {
    render(<IdCardBack card={makeIdCard()} />);
    expect(screen.getByText("Student Signature")).toBeInTheDocument();
    expect(screen.getByText("Authorized Signature")).toBeInTheDocument();
  });
});

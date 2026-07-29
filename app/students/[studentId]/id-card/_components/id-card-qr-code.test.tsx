import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IdCardQrCode } from "./id-card-qr-code";

// QR Test: verifies the QR component actually encodes the given value into the rendered SVG
// (not just that "something" renders) — react-qr-code renders a <path> whose `d` attribute is
// derived from `value`, so two different values must never produce identical markup.
describe("IdCardQrCode", () => {
  it("renders an SVG QR code", () => {
    const { container } = render(<IdCardQrCode value="11111111-1111-4111-8111-111111111111" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("encodes different values into different QR markup", () => {
    const { container: containerA } = render(<IdCardQrCode value="student-a-uuid" />);
    const { container: containerB } = render(<IdCardQrCode value="student-b-uuid" />);

    const svgA = containerA.querySelector("svg")?.innerHTML;
    const svgB = containerB.querySelector("svg")?.innerHTML;

    expect(svgA).toBeTruthy();
    expect(svgB).toBeTruthy();
    expect(svgA).not.toBe(svgB);
  });

  it("renders identically for the same value (deterministic encoding)", () => {
    const { container: first } = render(<IdCardQrCode value="same-value" />);
    const { container: second } = render(<IdCardQrCode value="same-value" />);
    expect(first.querySelector("svg")?.innerHTML).toBe(second.querySelector("svg")?.innerHTML);
  });

  it("sizes the wrapper in real mm units for print accuracy", () => {
    const { getByTestId } = render(<IdCardQrCode value="x" sizeMm={20} />);
    const wrapper = getByTestId("id-card-qr-code");
    expect(wrapper).toHaveStyle({ width: "20mm", height: "20mm" });
  });
});

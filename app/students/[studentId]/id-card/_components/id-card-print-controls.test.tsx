import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { createRef } from "react";
import { IdCardPrintControls } from "./id-card-print-controls";

const toPngMock = vi.fn();
vi.mock("html-to-image", () => ({
  toPng: (...args: unknown[]) => toPngMock(...args),
}));

const addImageMock = vi.fn();
const addPageMock = vi.fn();
const saveMock = vi.fn();
vi.mock("jspdf", () => ({
  jsPDF: vi.fn().mockImplementation(function MockJsPdf() {
    return { addImage: addImageMock, addPage: addPageMock, save: saveMock };
  }),
}));

describe("IdCardPrintControls", () => {
  beforeEach(() => {
    toPngMock.mockReset().mockResolvedValue("data:image/png;base64,fake");
    addImageMock.mockReset();
    addPageMock.mockReset();
    saveMock.mockReset();
  });

  it("renders nothing when canPrint is false", () => {
    const frontRef = createRef<HTMLDivElement>();
    const backRef = createRef<HTMLDivElement>();
    const { container } = render(
      <IdCardPrintControls frontRef={frontRef} backRef={backRef} studentName="Jane Doe" canPrint={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders Print, Export PDF, and Export PNG buttons when canPrint is true", () => {
    const frontRef = createRef<HTMLDivElement>();
    const backRef = createRef<HTMLDivElement>();
    render(<IdCardPrintControls frontRef={frontRef} backRef={backRef} studentName="Jane Doe" canPrint />);

    expect(screen.getByRole("button", { name: "Print" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export pdf/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export png/i })).toBeInTheDocument();
  });

  it("calls window.print() when Print is clicked", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    const frontRef = createRef<HTMLDivElement>();
    const backRef = createRef<HTMLDivElement>();
    render(<IdCardPrintControls frontRef={frontRef} backRef={backRef} studentName="Jane Doe" canPrint />);

    await userEvent.click(screen.getByRole("button", { name: "Print" }));
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  it("assembles a 2-page PDF sized to the CR80 card when Export PDF is clicked", async () => {
    // Attach real DOM nodes so the refs are non-null when the handler reads `.current`.
    document.body.innerHTML = '<div id="front"></div><div id="back"></div>';
    const frontRef = { current: document.getElementById("front") as HTMLDivElement };
    const backRef = { current: document.getElementById("back") as HTMLDivElement };

    render(<IdCardPrintControls frontRef={frontRef} backRef={backRef} studentName="Jane Doe" canPrint />);
    await userEvent.click(screen.getByRole("button", { name: /export pdf/i }));

    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));

    expect(toPngMock).toHaveBeenCalledTimes(2);
    expect(addImageMock).toHaveBeenCalledWith("data:image/png;base64,fake", "PNG", 0, 0, 85.6, 53.98);
    expect(addPageMock).toHaveBeenCalledWith([85.6, 53.98], "landscape");
    expect(saveMock).toHaveBeenCalledWith("Jane Doe-id-card.pdf");
  });
});

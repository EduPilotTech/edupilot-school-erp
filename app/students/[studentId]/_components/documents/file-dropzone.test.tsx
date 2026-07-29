import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileDropzone } from "./file-dropzone";

function makeFile(name: string, type: string) {
  return new File(["content"], name, { type });
}

describe("FileDropzone", () => {
  it("calls onFilesSelected when a file is chosen via the hidden input", async () => {
    const onFilesSelected = vi.fn();
    const { container } = render(<FileDropzone accept={["image/jpeg"]} onFilesSelected={onFilesSelected} />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile("photo.jpg", "image/jpeg");
    await userEvent.upload(fileInput, file);

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it("renders the provided label and hint", () => {
    render(
      <FileDropzone
        accept={["application/pdf"]}
        onFilesSelected={vi.fn()}
        label="Custom label"
        hint="Custom hint"
      />
    );
    expect(screen.getByText("Custom label")).toBeInTheDocument();
    expect(screen.getByText("Custom hint")).toBeInTheDocument();
  });

  it("marks the dropzone as disabled and does not accept keyboard activation", () => {
    render(<FileDropzone accept={["image/jpeg"]} disabled onFilesSelected={vi.fn()} />);

    const zone = screen.getByRole("button");
    expect(zone).toHaveAttribute("aria-disabled", "true");
    expect(zone).toHaveAttribute("tabIndex", "-1");
  });

  it("only accepts a single file when multiple is false, even if several are dropped", async () => {
    const onFilesSelected = vi.fn();
    const { container } = render(<FileDropzone accept={["image/jpeg"]} onFilesSelected={onFilesSelected} />);

    const zone = container.firstChild as HTMLElement;
    const files = [makeFile("a.jpg", "image/jpeg"), makeFile("b.jpg", "image/jpeg")];

    // Simulate a native drop event carrying multiple files.
    const dropEvent = new Event("drop", { bubbles: true, cancelable: true }) as unknown as DragEvent;
    Object.defineProperty(dropEvent, "dataTransfer", { value: { files } });
    zone.dispatchEvent(dropEvent);

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onFilesSelected).toHaveBeenCalledWith([files[0]]);
  });
});

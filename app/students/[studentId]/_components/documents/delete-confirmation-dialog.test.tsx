import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

describe("DeleteConfirmationDialog", () => {
  it("renders the title and message", () => {
    render(
      <DeleteConfirmationDialog
        title="Delete document"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText("Delete document")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const onCancel = vi.fn();
    render(
      <DeleteConfirmationDialog title="t" message="m" onConfirm={vi.fn()} onCancel={onCancel} />
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when Delete is clicked", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <DeleteConfirmationDialog title="t" message="m" onConfirm={onConfirm} onCancel={vi.fn()} />
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables both buttons while the confirm action is in flight", async () => {
    let resolveConfirm: () => void = () => {};
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve;
        })
    );
    render(
      <DeleteConfirmationDialog title="t" message="m" onConfirm={onConfirm} onCancel={vi.fn()} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Deleting/ })).toBeDisabled();

    resolveConfirm();
  });
});

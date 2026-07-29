import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { FeeCategoryManager } from "./FeeCategoryManager";
import {
  createFeeCategoryAction,
  updateFeeCategoryAction,
  deleteFeeCategoryAction,
} from "@/app/fees/setup/actions";
import type { FeeCategoryDTO } from "@/modules/fees/application/dto/fee-category.dto";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/app/fees/setup/actions", () => ({
  createFeeCategoryAction: vi.fn(),
  updateFeeCategoryAction: vi.fn(),
  deleteFeeCategoryAction: vi.fn(),
}));

const mockedCreate = vi.mocked(createFeeCategoryAction);
const mockedUpdate = vi.mocked(updateFeeCategoryAction);
const mockedDelete = vi.mocked(deleteFeeCategoryAction);

const CATEGORIES: FeeCategoryDTO[] = [
  {
    id: "cat1",
    schoolId: "school-1",
    name: "Tuition Fee",
    code: "TUITION",
    isRecurring: true,
    hsnSacCode: null,
    taxRatePercent: null,
    isActive: true,
  },
];

describe("FeeCategoryManager", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    mockedCreate.mockReset();
    mockedUpdate.mockReset();
    mockedDelete.mockReset();
  });

  it("hides the create form and row actions when canManage is false", () => {
    render(<FeeCategoryManager items={CATEGORIES} canManage={false} />);
    expect(screen.queryByPlaceholderText("Tuition Fee")).not.toBeInTheDocument();
    expect(screen.queryByText("Deactivate")).not.toBeInTheDocument();
  });

  it("shows an empty-state message when there are no fee categories", () => {
    render(<FeeCategoryManager items={[]} canManage />);
    expect(screen.getByText(/no fee categories yet/i)).toBeInTheDocument();
  });

  it("creates a fee category and refreshes on success", async () => {
    mockedCreate.mockResolvedValue({
      success: true,
      data: {
        id: "cat2",
        schoolId: "school-1",
        name: "Transport Fee",
        code: "TRANSPORT",
        isRecurring: true,
        hsnSacCode: null,
        taxRatePercent: null,
        isActive: true,
      },
    });

    render(<FeeCategoryManager items={CATEGORIES} canManage />);
    fireEvent.change(screen.getByPlaceholderText("Tuition Fee"), { target: { value: "Transport Fee" } });
    fireEvent.change(screen.getByPlaceholderText("TUITION"), { target: { value: "TRANSPORT" } });
    fireEvent.click(screen.getByRole("button", { name: /add fee category/i }));

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith({ name: "Transport Fee", code: "TRANSPORT", isRecurring: true });
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows the server error message on create failure and does not refresh", async () => {
    mockedCreate.mockResolvedValue({
      success: false,
      error: { code: "FEE_CATEGORY_ALREADY_EXISTS", message: "A fee category with this code already exists." },
    });

    render(<FeeCategoryManager items={CATEGORIES} canManage />);
    fireEvent.change(screen.getByPlaceholderText("Tuition Fee"), { target: { value: "Transport Fee" } });
    fireEvent.change(screen.getByPlaceholderText("TUITION"), { target: { value: "TUITION" } });
    fireEvent.click(screen.getByRole("button", { name: /add fee category/i }));

    expect(await screen.findByText("A fee category with this code already exists.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("toggles a fee category's active state", async () => {
    mockedUpdate.mockResolvedValue({ success: true, data: { ...CATEGORIES[0], isActive: false } });

    render(<FeeCategoryManager items={CATEGORIES} canManage />);
    fireEvent.click(screen.getByRole("button", { name: /deactivate/i }));

    await waitFor(() => {
      expect(mockedUpdate).toHaveBeenCalledWith("cat1", { isActive: false });
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("deletes a fee category", async () => {
    mockedDelete.mockResolvedValue({ success: true, data: null });

    render(<FeeCategoryManager items={CATEGORIES} canManage />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(mockedDelete).toHaveBeenCalledWith("cat1");
    });
    expect(refreshMock).toHaveBeenCalled();
  });
});

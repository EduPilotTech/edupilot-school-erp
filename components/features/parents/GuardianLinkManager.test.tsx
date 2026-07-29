import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { GuardianLinkManager } from "./GuardianLinkManager";
import { linkGuardianAccountAction } from "@/app/settings/parents/actions";
import type { GuardianEntity } from "@/modules/students/domain/guardian.entity";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/app/settings/parents/actions", () => ({
  linkGuardianAccountAction: vi.fn(),
}));

const mockedLink = vi.mocked(linkGuardianAccountAction);

function makeGuardian(overrides: Partial<GuardianEntity> = {}): GuardianEntity {
  return {
    id: "g1",
    tenantId: "tenant-1",
    fullName: "Asha Verma",
    phone: "9876543210",
    email: "asha@example.com",
    occupation: null,
    userProfileId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

describe("GuardianLinkManager", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    mockedLink.mockReset();
  });

  it("shows a prompt to search when there are no results and no search term", () => {
    render(<GuardianLinkManager guardians={[]} search="" />);
    expect(screen.getByText(/search for a guardian/i)).toBeInTheDocument();
  });

  it("shows a no-match message when a search returns nothing", () => {
    render(<GuardianLinkManager guardians={[]} search="nobody" />);
    expect(screen.getByText(/no guardians match your search/i)).toBeInTheDocument();
  });

  it("hides the grant-access button for a guardian already linked", () => {
    render(<GuardianLinkManager guardians={[makeGuardian({ userProfileId: "user-1" })]} search="asha" />);
    expect(screen.getByText("Linked")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /grant portal access/i })).not.toBeInTheDocument();
  });

  it("disables the grant-access button when the guardian has no email on file", () => {
    render(<GuardianLinkManager guardians={[makeGuardian({ email: null })]} search="asha" />);
    expect(screen.getByRole("button", { name: /grant portal access/i })).toBeDisabled();
  });

  it("links a guardian and refreshes on success", async () => {
    mockedLink.mockResolvedValue({ success: true, data: makeGuardian({ userProfileId: "user-1" }) });

    render(<GuardianLinkManager guardians={[makeGuardian()]} search="asha" />);
    fireEvent.click(screen.getByRole("button", { name: /grant portal access/i }));

    await waitFor(() => {
      expect(mockedLink).toHaveBeenCalledWith({ guardianId: "g1" });
    });
    expect(await screen.findByText(/invitation sent to asha@example.com/i)).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows the server error message on failure and does not refresh", async () => {
    mockedLink.mockResolvedValue({
      success: false,
      error: { code: "GUARDIAN_ALREADY_LINKED", message: "This guardian already has a parent portal account." },
    });

    render(<GuardianLinkManager guardians={[makeGuardian()]} search="asha" />);
    fireEvent.click(screen.getByRole("button", { name: /grant portal access/i }));

    expect(await screen.findByText("This guardian already has a parent portal account.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NotificationList } from "./NotificationList";
import { markNotificationReadAction } from "@/app/parent/actions";
import type { NotificationEntity } from "@/modules/communication/domain/notification.entity";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/app/parent/actions", () => ({
  markNotificationReadAction: vi.fn(),
}));

const mockedMarkRead = vi.mocked(markNotificationReadAction);

const NOTIFICATIONS: NotificationEntity[] = [
  {
    id: "n1",
    tenantId: "tenant-1",
    recipientUserProfileId: "user-1",
    type: "NOTICE",
    priority: "URGENT",
    title: "School closed tomorrow",
    body: "Due to weather, the school will be closed.",
    referenceType: "Notice",
    referenceId: "notice-1",
    readAt: null,
    createdAt: new Date("2026-07-29T10:00:00.000Z"),
  },
  {
    id: "n2",
    tenantId: "tenant-1",
    recipientUserProfileId: "user-1",
    type: "MESSAGE",
    priority: "NORMAL",
    title: "New message",
    body: "You have a new message from Ms. Rao.",
    referenceType: "MessageThread",
    referenceId: "thread-1",
    readAt: new Date("2026-07-29T11:00:00.000Z"),
    createdAt: new Date("2026-07-29T10:30:00.000Z"),
  },
];

describe("NotificationList", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    mockedMarkRead.mockReset();
  });

  it("shows an empty-state message when there are no notifications", () => {
    render(<NotificationList notifications={[]} />);
    expect(screen.getByText(/no notifications yet/i)).toBeInTheDocument();
  });

  it("shows a 'Mark read' action only for unread notifications", () => {
    render(<NotificationList notifications={NOTIFICATIONS} />);
    expect(screen.getAllByRole("button", { name: /mark read/i })).toHaveLength(1);
  });

  it("marks a notification read and refreshes on success", async () => {
    mockedMarkRead.mockResolvedValue({ success: true, data: { ...NOTIFICATIONS[0], readAt: new Date() } });

    render(<NotificationList notifications={NOTIFICATIONS} />);
    fireEvent.click(screen.getByRole("button", { name: /mark read/i }));

    await waitFor(() => {
      expect(mockedMarkRead).toHaveBeenCalledWith("n1");
    });
    expect(refreshMock).toHaveBeenCalled();
  });
});

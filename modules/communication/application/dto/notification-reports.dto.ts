import type { NotificationChannelValue, NotificationDeliveryStatusValue } from "../../domain/notification-delivery.entity";
import type { NotificationPriorityValue, NotificationTypeValue } from "../../domain/notification.entity";

export interface NotificationReportFilterInput {
  type?: NotificationTypeValue;
  channel?: NotificationChannelValue;
  fromDate?: Date;
  toDate?: Date;
}

export interface NotificationReportItemDTO {
  id: string;
  recipientUserProfileId: string;
  type: NotificationTypeValue;
  priority: NotificationPriorityValue;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  deliveries: {
    channel: NotificationChannelValue;
    status: NotificationDeliveryStatusValue;
    provider: string | null;
    sentAt: string | null;
    error: string | null;
  }[];
}

export interface DeliveryReportFilterInput {
  channel?: NotificationChannelValue;
  status?: NotificationDeliveryStatusValue;
  fromDate?: Date;
  toDate?: Date;
}

export interface DeliveryReportItemDTO {
  id: string;
  notificationId: string;
  channel: NotificationChannelValue;
  status: NotificationDeliveryStatusValue;
  provider: string | null;
  providerMessageId: string | null;
  sentAt: string | null;
  error: string | null;
  createdAt: string;
}

export interface DeliveryReportDTO {
  items: DeliveryReportItemDTO[];
  countsByStatus: Record<NotificationDeliveryStatusValue, number>;
}

export interface FailedNotificationsReportFilterInput {
  channel?: NotificationChannelValue;
  fromDate?: Date;
  toDate?: Date;
}

export interface FailedNotificationReportItemDTO {
  deliveryId: string;
  notificationId: string;
  channel: NotificationChannelValue;
  error: string | null;
  createdAt: string;
  notificationTitle: string;
  recipientUserProfileId: string;
}

export interface CommunicationDashboardDTO {
  todaysNotifications: number;
  queued: number;
  pending: number;
  delivered: number;
  failed: number;
}

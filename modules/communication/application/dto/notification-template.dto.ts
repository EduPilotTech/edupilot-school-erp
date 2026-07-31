import { z } from "zod";
import type { NotificationChannelValue } from "../../domain/notification-delivery.entity";

// Mirrors NotificationChannel's runtime values directly (see notice.dto.ts's own
// `z.enum(["ALL", "CLASS", "SECTION"])` precedent for hand-matching a Prisma enum in a zod schema
// rather than importing the Prisma-generated enum into application/domain code).
const notificationChannelValues = ["IN_APP", "EMAIL", "SMS", "WHATSAPP", "PUSH"] as const;

export const createNotificationTemplateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  channel: z.enum(notificationChannelValues),
  // Only meaningful for EMAIL — left undefined/omitted for other channels.
  subject: z.string().trim().max(500).optional(),
  message: z.string().trim().min(1, "Message is required.").max(10000),
  variables: z.array(z.string().trim().min(1)).max(50).optional(),
});
export type CreateNotificationTemplateServiceInput = z.infer<typeof createNotificationTemplateSchema>;

export const updateNotificationTemplateSchema = z.object({
  subject: z.string().trim().max(500).optional(),
  message: z.string().trim().min(1, "Message is required.").max(10000).optional(),
  variables: z.array(z.string().trim().min(1)).max(50).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateNotificationTemplateServiceInput = z.infer<typeof updateNotificationTemplateSchema>;

export interface NotificationTemplateDTO {
  id: string;
  name: string;
  channel: NotificationChannelValue;
  subject: string | null;
  message: string;
  variables: string[];
  isActive: boolean;
}

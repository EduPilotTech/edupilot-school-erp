import type { NotificationChannelValue } from "./notification-delivery.entity";

// Genuinely new this phase (Phase 15A) — per-channel message templates with named `{{variable}}`
// placeholders, so a producer can render "Fee due of {{amount}} on {{dueDate}}" instead of
// hand-building every string. `variables` is stored as `Json` in Prisma (default `[]`) but
// treated as a plain `string[]` here at the domain boundary — the infrastructure layer
// (PrismaNotificationTemplateRepository) owns the parse/serialize at the Prisma boundary, per
// this codebase's "domain layer has zero imports from Prisma" rule.
export interface NotificationTemplateEntity {
  id: string;
  tenantId: string;
  name: string;
  channel: NotificationChannelValue;
  // Only meaningful for EMAIL — null for SMS/WhatsApp/In-App templates (mirrors the schema
  // column's own comment).
  subject: string | null;
  message: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

-- CreateEnum
CREATE TYPE "NotificationQueueStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ADMISSION_CONFIRMATION';
ALTER TYPE "NotificationType" ADD VALUE 'FEE_PAYMENT_SUCCESS';
ALTER TYPE "NotificationType" ADD VALUE 'EXAM_SCHEDULE';
ALTER TYPE "NotificationType" ADD VALUE 'HOLIDAY_NOTICE';
ALTER TYPE "NotificationType" ADD VALUE 'BIRTHDAY_WISHES';
ALTER TYPE "NotificationType" ADD VALUE 'HOSTEL_NOTICE';

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_queue" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "notification_id" UUID NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMPTZ(3) NOT NULL,
    "processed_at" TIMESTAMPTZ(3),
    "status" "NotificationQueueStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notification_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_templates_tenant_id_channel_is_active_idx" ON "notification_templates"("tenant_id", "channel", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_tenant_id_id_key" ON "notification_templates"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_tenant_id_name_channel_key" ON "notification_templates"("tenant_id", "name", "channel");

-- CreateIndex
CREATE INDEX "notification_queue_tenant_id_status_scheduled_at_idx" ON "notification_queue"("tenant_id", "status", "scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_queue_tenant_id_id_key" ON "notification_queue"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_queue_tenant_id_notification_id_key" ON "notification_queue"("tenant_id", "notification_id");

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_tenant_id_notification_id_fkey" FOREIGN KEY ("tenant_id", "notification_id") REFERENCES "notifications"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;


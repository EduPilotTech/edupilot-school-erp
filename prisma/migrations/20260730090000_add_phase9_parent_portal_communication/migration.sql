-- CreateEnum
CREATE TYPE "HomeworkStatusValue" AS ENUM ('PENDING', 'SUBMITTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NoticeAudience" AS ENUM ('ALL', 'CLASS', 'SECTION');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('EXAM', 'PTM', 'EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "MessageSenderRole" AS ENUM ('PARENT', 'TEACHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NOTICE', 'HOMEWORK', 'FEE_DUE', 'ATTENDANCE_ALERT', 'MESSAGE', 'EXAM_RESULT', 'CALENDAR_EVENT');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DELIVERED');

-- AlterTable
ALTER TABLE "guardians" ADD COLUMN     "user_profile_id" UUID;

-- CreateTable
CREATE TABLE "parent_activity_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "guardian_id" UUID NOT NULL,
    "user_profile_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "ip_address" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "section_id" UUID,
    "subject_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assigned_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "attachment_key" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "homework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework_statuses" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "homework_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "status" "HomeworkStatusValue" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "homework_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" "NoticeAudience" NOT NULL DEFAULT 'ALL',
    "class_id" UUID,
    "section_id" UUID,
    "attachment_key" TEXT,
    "published_at" TIMESTAMPTZ(3),
    "expires_at" TIMESTAMPTZ(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_type" "CalendarEventType" NOT NULL DEFAULT 'EVENT',
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_threads" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "guardian_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "subject" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "sender_user_profile_id" UUID NOT NULL,
    "sender_role" "MessageSenderRole" NOT NULL,
    "body" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "recipient_user_profile_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "reference_type" TEXT,
    "reference_id" UUID,
    "read_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "notification_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "provider_message_id" TEXT,
    "sent_at" TIMESTAMPTZ(3),
    "error" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parent_activity_logs_tenant_id_guardian_id_created_at_idx" ON "parent_activity_logs"("tenant_id", "guardian_id", "created_at");

-- CreateIndex
CREATE INDEX "parent_activity_logs_tenant_id_user_profile_id_created_at_idx" ON "parent_activity_logs"("tenant_id", "user_profile_id", "created_at");

-- CreateIndex
CREATE INDEX "homework_tenant_id_class_id_section_id_idx" ON "homework"("tenant_id", "class_id", "section_id");

-- CreateIndex
CREATE INDEX "homework_tenant_id_academic_session_id_due_date_idx" ON "homework"("tenant_id", "academic_session_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "homework_tenant_id_id_key" ON "homework"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "homework_statuses_tenant_id_student_id_idx" ON "homework_statuses"("tenant_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "homework_statuses_tenant_id_id_key" ON "homework_statuses"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "homework_statuses_tenant_id_homework_id_student_id_key" ON "homework_statuses"("tenant_id", "homework_id", "student_id");

-- CreateIndex
CREATE INDEX "notices_tenant_id_academic_session_id_published_at_idx" ON "notices"("tenant_id", "academic_session_id", "published_at");

-- CreateIndex
CREATE INDEX "notices_tenant_id_class_id_idx" ON "notices"("tenant_id", "class_id");

-- CreateIndex
CREATE INDEX "notices_tenant_id_section_id_idx" ON "notices"("tenant_id", "section_id");

-- CreateIndex
CREATE UNIQUE INDEX "notices_tenant_id_id_key" ON "notices"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "calendar_events_tenant_id_academic_session_id_start_date_idx" ON "calendar_events"("tenant_id", "academic_session_id", "start_date");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_tenant_id_id_key" ON "calendar_events"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "message_threads_tenant_id_guardian_id_idx" ON "message_threads"("tenant_id", "guardian_id");

-- CreateIndex
CREATE INDEX "message_threads_tenant_id_teacher_id_idx" ON "message_threads"("tenant_id", "teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_threads_tenant_id_id_key" ON "message_threads"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "message_threads_tenant_id_student_id_guardian_id_teacher_id_key" ON "message_threads"("tenant_id", "student_id", "guardian_id", "teacher_id");

-- CreateIndex
CREATE INDEX "messages_tenant_id_thread_id_sent_at_idx" ON "messages"("tenant_id", "thread_id", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "messages_tenant_id_id_key" ON "messages"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_recipient_user_profile_id_read_at_idx" ON "notifications"("tenant_id", "recipient_user_profile_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_recipient_user_profile_id_created_a_idx" ON "notifications"("tenant_id", "recipient_user_profile_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_tenant_id_id_key" ON "notifications"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "notification_deliveries_tenant_id_notification_id_idx" ON "notification_deliveries"("tenant_id", "notification_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_deliveries_tenant_id_id_key" ON "notification_deliveries"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_deliveries_tenant_id_notification_id_channel_key" ON "notification_deliveries"("tenant_id", "notification_id", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_user_profile_id_key" ON "guardians"("user_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_tenant_id_user_profile_id_key" ON "guardians"("tenant_id", "user_profile_id");

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_tenant_id_user_profile_id_fkey" FOREIGN KEY ("tenant_id", "user_profile_id") REFERENCES "user_profiles"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_activity_logs" ADD CONSTRAINT "parent_activity_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_activity_logs" ADD CONSTRAINT "parent_activity_logs_tenant_id_guardian_id_fkey" FOREIGN KEY ("tenant_id", "guardian_id") REFERENCES "guardians"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_activity_logs" ADD CONSTRAINT "parent_activity_logs_tenant_id_user_profile_id_fkey" FOREIGN KEY ("tenant_id", "user_profile_id") REFERENCES "user_profiles"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_tenant_id_class_id_fkey" FOREIGN KEY ("tenant_id", "class_id") REFERENCES "classes"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_tenant_id_section_id_fkey" FOREIGN KEY ("tenant_id", "section_id") REFERENCES "sections"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_tenant_id_subject_id_fkey" FOREIGN KEY ("tenant_id", "subject_id") REFERENCES "subjects"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_tenant_id_teacher_id_fkey" FOREIGN KEY ("tenant_id", "teacher_id") REFERENCES "teachers"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_statuses" ADD CONSTRAINT "homework_statuses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_statuses" ADD CONSTRAINT "homework_statuses_tenant_id_homework_id_fkey" FOREIGN KEY ("tenant_id", "homework_id") REFERENCES "homework"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_statuses" ADD CONSTRAINT "homework_statuses_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_tenant_id_class_id_fkey" FOREIGN KEY ("tenant_id", "class_id") REFERENCES "classes"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_tenant_id_section_id_fkey" FOREIGN KEY ("tenant_id", "section_id") REFERENCES "sections"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_tenant_id_guardian_id_fkey" FOREIGN KEY ("tenant_id", "guardian_id") REFERENCES "guardians"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_tenant_id_teacher_id_fkey" FOREIGN KEY ("tenant_id", "teacher_id") REFERENCES "teachers"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_thread_id_fkey" FOREIGN KEY ("tenant_id", "thread_id") REFERENCES "message_threads"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_sender_user_profile_id_fkey" FOREIGN KEY ("tenant_id", "sender_user_profile_id") REFERENCES "user_profiles"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_recipient_user_profile_id_fkey" FOREIGN KEY ("tenant_id", "recipient_user_profile_id") REFERENCES "user_profiles"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_tenant_id_notification_id_fkey" FOREIGN KEY ("tenant_id", "notification_id") REFERENCES "notifications"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;


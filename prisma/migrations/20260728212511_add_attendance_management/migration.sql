-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE');

-- CreateTable
CREATE TABLE "student_attendance" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "remarks" TEXT,
    "marked_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "student_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_attendance" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_profile_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "remarks" TEXT,
    "marked_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "teacher_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_attendance_tenant_id_class_id_section_id_date_idx" ON "student_attendance"("tenant_id", "class_id", "section_id", "date");

-- CreateIndex
CREATE INDEX "student_attendance_tenant_id_academic_session_id_date_idx" ON "student_attendance"("tenant_id", "academic_session_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "student_attendance_tenant_id_student_id_date_key" ON "student_attendance"("tenant_id", "student_id", "date");

-- CreateIndex
CREATE INDEX "teacher_attendance_tenant_id_date_idx" ON "teacher_attendance"("tenant_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_attendance_tenant_id_user_profile_id_date_key" ON "teacher_attendance"("tenant_id", "user_profile_id", "date");

-- AddForeignKey
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_tenant_id_class_id_fkey" FOREIGN KEY ("tenant_id", "class_id") REFERENCES "classes"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_tenant_id_section_id_fkey" FOREIGN KEY ("tenant_id", "section_id") REFERENCES "sections"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_attendance" ADD CONSTRAINT "teacher_attendance_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_attendance" ADD CONSTRAINT "teacher_attendance_tenant_id_user_profile_id_fkey" FOREIGN KEY ("tenant_id", "user_profile_id") REFERENCES "user_profiles"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

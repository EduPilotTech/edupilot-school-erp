-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classrooms" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "capacity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_profile_id" UUID NOT NULL,
    "employee_code" TEXT NOT NULL,
    "joining_date" DATE NOT NULL,
    "qualification" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "working_days" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "is_working" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "working_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "period_configurations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "period_number" INTEGER NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "is_break" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "period_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_assignments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "teacher_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_entries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "teacher_assignment_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "classroom_id" UUID,
    "period_id" UUID NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "timetable_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subjects_tenant_id_school_id_idx" ON "subjects"("tenant_id", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_tenant_id_id_key" ON "subjects"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_tenant_id_code_key" ON "subjects"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "classrooms_tenant_id_school_id_idx" ON "classrooms"("tenant_id", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_tenant_id_id_key" ON "classrooms"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_tenant_id_code_key" ON "classrooms"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "teachers_tenant_id_idx" ON "teachers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_tenant_id_id_key" ON "teachers"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_tenant_id_user_profile_id_key" ON "teachers"("tenant_id", "user_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_tenant_id_employee_code_key" ON "teachers"("tenant_id", "employee_code");

-- CreateIndex
CREATE INDEX "working_days_tenant_id_academic_session_id_idx" ON "working_days"("tenant_id", "academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "working_days_tenant_id_academic_session_id_day_of_week_key" ON "working_days"("tenant_id", "academic_session_id", "day_of_week");

-- CreateIndex
CREATE INDEX "holidays_tenant_id_academic_session_id_idx" ON "holidays"("tenant_id", "academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_tenant_id_academic_session_id_date_key" ON "holidays"("tenant_id", "academic_session_id", "date");

-- CreateIndex
CREATE INDEX "period_configurations_tenant_id_academic_session_id_idx" ON "period_configurations"("tenant_id", "academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "period_configurations_tenant_id_id_key" ON "period_configurations"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "period_configurations_tenant_id_academic_session_id_period__key" ON "period_configurations"("tenant_id", "academic_session_id", "period_number");

-- CreateIndex
CREATE INDEX "teacher_assignments_tenant_id_teacher_id_idx" ON "teacher_assignments"("tenant_id", "teacher_id");

-- CreateIndex
CREATE INDEX "teacher_assignments_tenant_id_class_id_section_id_idx" ON "teacher_assignments"("tenant_id", "class_id", "section_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_assignments_tenant_id_id_key" ON "teacher_assignments"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_assignments_tenant_id_teacher_id_subject_id_class_i_key" ON "teacher_assignments"("tenant_id", "teacher_id", "subject_id", "class_id", "section_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "timetable_entries_tenant_id_academic_session_id_idx" ON "timetable_entries"("tenant_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "timetable_entries_tenant_id_teacher_id_idx" ON "timetable_entries"("tenant_id", "teacher_id");

-- CreateIndex
CREATE INDEX "timetable_entries_tenant_id_classroom_id_idx" ON "timetable_entries"("tenant_id", "classroom_id");

-- CreateIndex
CREATE UNIQUE INDEX "timetable_entries_tenant_id_section_id_day_of_week_period_i_key" ON "timetable_entries"("tenant_id", "section_id", "day_of_week", "period_id");

-- CreateIndex
CREATE UNIQUE INDEX "timetable_entries_tenant_id_teacher_id_day_of_week_period_i_key" ON "timetable_entries"("tenant_id", "teacher_id", "day_of_week", "period_id");

-- CreateIndex
CREATE UNIQUE INDEX "timetable_entries_tenant_id_classroom_id_day_of_week_period_key" ON "timetable_entries"("tenant_id", "classroom_id", "day_of_week", "period_id");

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_tenant_id_school_id_fkey" FOREIGN KEY ("tenant_id", "school_id") REFERENCES "schools"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_tenant_id_school_id_fkey" FOREIGN KEY ("tenant_id", "school_id") REFERENCES "schools"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_tenant_id_user_profile_id_fkey" FOREIGN KEY ("tenant_id", "user_profile_id") REFERENCES "user_profiles"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_days" ADD CONSTRAINT "working_days_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_days" ADD CONSTRAINT "working_days_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_configurations" ADD CONSTRAINT "period_configurations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_configurations" ADD CONSTRAINT "period_configurations_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_tenant_id_teacher_id_fkey" FOREIGN KEY ("tenant_id", "teacher_id") REFERENCES "teachers"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_tenant_id_subject_id_fkey" FOREIGN KEY ("tenant_id", "subject_id") REFERENCES "subjects"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_tenant_id_class_id_fkey" FOREIGN KEY ("tenant_id", "class_id") REFERENCES "classes"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_tenant_id_section_id_fkey" FOREIGN KEY ("tenant_id", "section_id") REFERENCES "sections"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_tenant_id_teacher_assignment_id_fkey" FOREIGN KEY ("tenant_id", "teacher_assignment_id") REFERENCES "teacher_assignments"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_tenant_id_class_id_fkey" FOREIGN KEY ("tenant_id", "class_id") REFERENCES "classes"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_tenant_id_section_id_fkey" FOREIGN KEY ("tenant_id", "section_id") REFERENCES "sections"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_tenant_id_subject_id_fkey" FOREIGN KEY ("tenant_id", "subject_id") REFERENCES "subjects"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_tenant_id_teacher_id_fkey" FOREIGN KEY ("tenant_id", "teacher_id") REFERENCES "teachers"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_tenant_id_classroom_id_fkey" FOREIGN KEY ("tenant_id", "classroom_id") REFERENCES "classrooms"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_tenant_id_period_id_fkey" FOREIGN KEY ("tenant_id", "period_id") REFERENCES "period_configurations"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

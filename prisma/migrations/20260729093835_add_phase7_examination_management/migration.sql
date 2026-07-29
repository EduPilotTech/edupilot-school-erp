-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ONGOING', 'MARKS_ENTRY_COMPLETED', 'RESULT_GENERATED', 'RESULT_PUBLISHED');

-- CreateEnum
CREATE TYPE "ExamResultStatus" AS ENUM ('PASS', 'FAIL');

-- CreateTable
CREATE TABLE "exam_types" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,
    "schoolId" UUID,

    CONSTRAINT "exam_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_scales" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "grade_scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_bands" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "grade_scale_id" UUID NOT NULL,
    "min_percentage" DOUBLE PRECISION NOT NULL,
    "max_percentage" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "grade_point" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "grade_bands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "exam_type_id" UUID NOT NULL,
    "grade_scale_id" UUID,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_subjects" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "max_marks" DOUBLE PRECISION NOT NULL,
    "passing_marks" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "exam_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marks_entries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "exam_subject_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "marksObtained" DOUBLE PRECISION,
    "is_absent" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "entered_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "marks_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_results" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "total_marks_obtained" DOUBLE PRECISION NOT NULL,
    "total_max_marks" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "overall_grade" TEXT,
    "grade_point" DOUBLE PRECISION,
    "rank" INTEGER,
    "status" "ExamResultStatus" NOT NULL,
    "generated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exam_types_tenant_id_idx" ON "exam_types"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_types_tenant_id_id_key" ON "exam_types"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_types_tenant_id_code_key" ON "exam_types"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "grade_scales_tenant_id_academic_session_id_idx" ON "grade_scales"("tenant_id", "academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "grade_scales_tenant_id_id_key" ON "grade_scales"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "grade_scales_tenant_id_academic_session_id_name_key" ON "grade_scales"("tenant_id", "academic_session_id", "name");

-- CreateIndex
CREATE INDEX "grade_bands_tenant_id_grade_scale_id_idx" ON "grade_bands"("tenant_id", "grade_scale_id");

-- CreateIndex
CREATE UNIQUE INDEX "grade_bands_tenant_id_id_key" ON "grade_bands"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "exams_tenant_id_academic_session_id_idx" ON "exams"("tenant_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "exams_tenant_id_exam_type_id_idx" ON "exams"("tenant_id", "exam_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "exams_tenant_id_id_key" ON "exams"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "exams_tenant_id_academic_session_id_name_key" ON "exams"("tenant_id", "academic_session_id", "name");

-- CreateIndex
CREATE INDEX "exam_subjects_tenant_id_exam_id_idx" ON "exam_subjects"("tenant_id", "exam_id");

-- CreateIndex
CREATE INDEX "exam_subjects_tenant_id_class_id_idx" ON "exam_subjects"("tenant_id", "class_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_subjects_tenant_id_id_key" ON "exam_subjects"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_subjects_tenant_id_exam_id_class_id_subject_id_key" ON "exam_subjects"("tenant_id", "exam_id", "class_id", "subject_id");

-- CreateIndex
CREATE INDEX "marks_entries_tenant_id_student_id_idx" ON "marks_entries"("tenant_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "marks_entries_tenant_id_exam_subject_id_student_id_key" ON "marks_entries"("tenant_id", "exam_subject_id", "student_id");

-- CreateIndex
CREATE INDEX "exam_results_tenant_id_exam_id_class_id_section_id_idx" ON "exam_results"("tenant_id", "exam_id", "class_id", "section_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_results_tenant_id_exam_id_student_id_key" ON "exam_results"("tenant_id", "exam_id", "student_id");

-- AddForeignKey
ALTER TABLE "exam_types" ADD CONSTRAINT "exam_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_types" ADD CONSTRAINT "exam_types_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_scales" ADD CONSTRAINT "grade_scales_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_scales" ADD CONSTRAINT "grade_scales_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_bands" ADD CONSTRAINT "grade_bands_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_bands" ADD CONSTRAINT "grade_bands_tenant_id_grade_scale_id_fkey" FOREIGN KEY ("tenant_id", "grade_scale_id") REFERENCES "grade_scales"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_tenant_id_exam_type_id_fkey" FOREIGN KEY ("tenant_id", "exam_type_id") REFERENCES "exam_types"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_tenant_id_grade_scale_id_fkey" FOREIGN KEY ("tenant_id", "grade_scale_id") REFERENCES "grade_scales"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_subjects" ADD CONSTRAINT "exam_subjects_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_subjects" ADD CONSTRAINT "exam_subjects_tenant_id_exam_id_fkey" FOREIGN KEY ("tenant_id", "exam_id") REFERENCES "exams"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_subjects" ADD CONSTRAINT "exam_subjects_tenant_id_class_id_fkey" FOREIGN KEY ("tenant_id", "class_id") REFERENCES "classes"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_subjects" ADD CONSTRAINT "exam_subjects_tenant_id_subject_id_fkey" FOREIGN KEY ("tenant_id", "subject_id") REFERENCES "subjects"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks_entries" ADD CONSTRAINT "marks_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks_entries" ADD CONSTRAINT "marks_entries_tenant_id_exam_subject_id_fkey" FOREIGN KEY ("tenant_id", "exam_subject_id") REFERENCES "exam_subjects"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks_entries" ADD CONSTRAINT "marks_entries_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_tenant_id_exam_id_fkey" FOREIGN KEY ("tenant_id", "exam_id") REFERENCES "exams"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_tenant_id_class_id_fkey" FOREIGN KEY ("tenant_id", "class_id") REFERENCES "classes"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_tenant_id_section_id_fkey" FOREIGN KEY ("tenant_id", "section_id") REFERENCES "sections"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "HostelType" AS ENUM ('BOYS', 'GIRLS', 'CO_ED');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY', 'OTHER');

-- CreateEnum
CREATE TYPE "RoomGenderType" AS ENUM ('BOYS', 'GIRLS', 'CO_ED');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "HostelAssignmentStatus" AS ENUM ('ACTIVE', 'TRANSFERRED', 'CHECKED_OUT');

-- CreateEnum
CREATE TYPE "HostelAttendanceSession" AS ENUM ('MORNING', 'NIGHT');

-- CreateEnum
CREATE TYPE "HostelAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "HostelLeaveType" AS ENUM ('REGULAR', 'EMERGENCY', 'WEEKEND');

-- CreateEnum
CREATE TYPE "HostelLeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DietType" AS ENUM ('VEG', 'NON_VEG', 'JAIN', 'VEGAN', 'OTHER');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER');

-- AlterTable
ALTER TABLE "fee_invoices" ADD COLUMN     "hostel_fee_rule_id" UUID;

-- CreateTable
CREATE TABLE "hostels" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "HostelType" NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "hostels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_buildings" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "hostel_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "hostel_buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_floors" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "building_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "floor_number" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "hostel_floors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_wings" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "building_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "hostel_wings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_rooms" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "floor_id" UUID NOT NULL,
    "wing_id" UUID,
    "room_number" TEXT NOT NULL,
    "room_type" "RoomType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "gender" "RoomGenderType" NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "hostel_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_beds" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "bed_number" TEXT NOT NULL,
    "status" "BedStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "hostel_beds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_hostel_assignments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "bed_id" UUID NOT NULL,
    "diet_preference" "DietType",
    "check_in_date" DATE NOT NULL,
    "check_out_date" DATE,
    "status" "HostelAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "student_hostel_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_attendance" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "student_hostel_assignment_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "session" "HostelAttendanceSession" NOT NULL,
    "status" "HostelAttendanceStatus" NOT NULL,
    "remarks" TEXT,
    "marked_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "hostel_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_leave_requests" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "student_hostel_assignment_id" UUID NOT NULL,
    "leave_type" "HostelLeaveType" NOT NULL,
    "from_date" DATE NOT NULL,
    "to_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "HostelLeaveStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(3),
    "rejection_reason" TEXT,
    "actual_return_date" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "hostel_leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_visitors" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "visitor_name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "entry_time" TIMESTAMPTZ(3) NOT NULL,
    "exit_time" TIMESTAMPTZ(3),
    "approved_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "hostel_visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mess_meal_plans" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "hostel_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "mess_meal_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mess_meals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "meal_plan_id" UUID NOT NULL,
    "meal_type" "MealType" NOT NULL,
    "diet_type" "DietType" NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "mess_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_fee_rules" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "hostel_id" UUID NOT NULL,
    "room_type" "RoomType" NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "fee_category_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "frequency" "FeeFrequency" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "hostel_fee_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hostels_tenant_id_school_id_idx" ON "hostels"("tenant_id", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "hostels_tenant_id_id_key" ON "hostels"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "hostels_tenant_id_code_key" ON "hostels"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "hostel_buildings_tenant_id_hostel_id_idx" ON "hostel_buildings"("tenant_id", "hostel_id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_buildings_tenant_id_id_key" ON "hostel_buildings"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_buildings_tenant_id_hostel_id_code_key" ON "hostel_buildings"("tenant_id", "hostel_id", "code");

-- CreateIndex
CREATE INDEX "hostel_floors_tenant_id_building_id_idx" ON "hostel_floors"("tenant_id", "building_id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_floors_tenant_id_id_key" ON "hostel_floors"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_floors_tenant_id_building_id_floor_number_key" ON "hostel_floors"("tenant_id", "building_id", "floor_number");

-- CreateIndex
CREATE INDEX "hostel_wings_tenant_id_building_id_idx" ON "hostel_wings"("tenant_id", "building_id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_wings_tenant_id_id_key" ON "hostel_wings"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_wings_tenant_id_building_id_name_key" ON "hostel_wings"("tenant_id", "building_id", "name");

-- CreateIndex
CREATE INDEX "hostel_rooms_tenant_id_floor_id_idx" ON "hostel_rooms"("tenant_id", "floor_id");

-- CreateIndex
CREATE INDEX "hostel_rooms_tenant_id_wing_id_idx" ON "hostel_rooms"("tenant_id", "wing_id");

-- CreateIndex
CREATE INDEX "hostel_rooms_tenant_id_status_idx" ON "hostel_rooms"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_rooms_tenant_id_id_key" ON "hostel_rooms"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_rooms_tenant_id_floor_id_room_number_key" ON "hostel_rooms"("tenant_id", "floor_id", "room_number");

-- CreateIndex
CREATE INDEX "hostel_beds_tenant_id_room_id_idx" ON "hostel_beds"("tenant_id", "room_id");

-- CreateIndex
CREATE INDEX "hostel_beds_tenant_id_status_idx" ON "hostel_beds"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_beds_tenant_id_id_key" ON "hostel_beds"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_beds_tenant_id_room_id_bed_number_key" ON "hostel_beds"("tenant_id", "room_id", "bed_number");

-- CreateIndex
CREATE INDEX "student_hostel_assignments_tenant_id_student_id_academic_se_idx" ON "student_hostel_assignments"("tenant_id", "student_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "student_hostel_assignments_tenant_id_room_id_idx" ON "student_hostel_assignments"("tenant_id", "room_id");

-- CreateIndex
CREATE INDEX "student_hostel_assignments_tenant_id_bed_id_idx" ON "student_hostel_assignments"("tenant_id", "bed_id");

-- CreateIndex
CREATE INDEX "student_hostel_assignments_tenant_id_student_id_check_out_d_idx" ON "student_hostel_assignments"("tenant_id", "student_id", "check_out_date");

-- CreateIndex
CREATE UNIQUE INDEX "student_hostel_assignments_tenant_id_id_key" ON "student_hostel_assignments"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "hostel_attendance_tenant_id_room_id_date_idx" ON "hostel_attendance"("tenant_id", "room_id", "date");

-- CreateIndex
CREATE INDEX "hostel_attendance_tenant_id_academic_session_id_date_idx" ON "hostel_attendance"("tenant_id", "academic_session_id", "date");

-- CreateIndex
CREATE INDEX "hostel_attendance_tenant_id_student_hostel_assignment_id_idx" ON "hostel_attendance"("tenant_id", "student_hostel_assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_attendance_tenant_id_student_id_date_session_key" ON "hostel_attendance"("tenant_id", "student_id", "date", "session");

-- CreateIndex
CREATE INDEX "hostel_leave_requests_tenant_id_student_id_status_idx" ON "hostel_leave_requests"("tenant_id", "student_id", "status");

-- CreateIndex
CREATE INDEX "hostel_leave_requests_tenant_id_status_from_date_idx" ON "hostel_leave_requests"("tenant_id", "status", "from_date");

-- CreateIndex
CREATE INDEX "hostel_leave_requests_tenant_id_student_hostel_assignment_i_idx" ON "hostel_leave_requests"("tenant_id", "student_hostel_assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_leave_requests_tenant_id_id_key" ON "hostel_leave_requests"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "hostel_visitors_tenant_id_student_id_entry_time_idx" ON "hostel_visitors"("tenant_id", "student_id", "entry_time");

-- CreateIndex
CREATE INDEX "hostel_visitors_tenant_id_entry_time_idx" ON "hostel_visitors"("tenant_id", "entry_time");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_visitors_tenant_id_id_key" ON "hostel_visitors"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "mess_meal_plans_tenant_id_hostel_id_idx" ON "mess_meal_plans"("tenant_id", "hostel_id");

-- CreateIndex
CREATE UNIQUE INDEX "mess_meal_plans_tenant_id_id_key" ON "mess_meal_plans"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "mess_meal_plans_tenant_id_hostel_id_name_key" ON "mess_meal_plans"("tenant_id", "hostel_id", "name");

-- CreateIndex
CREATE INDEX "mess_meals_tenant_id_meal_plan_id_idx" ON "mess_meals"("tenant_id", "meal_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "mess_meals_tenant_id_id_key" ON "mess_meals"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "mess_meals_tenant_id_meal_plan_id_meal_type_diet_type_key" ON "mess_meals"("tenant_id", "meal_plan_id", "meal_type", "diet_type");

-- CreateIndex
CREATE INDEX "hostel_fee_rules_tenant_id_academic_session_id_idx" ON "hostel_fee_rules"("tenant_id", "academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_fee_rules_tenant_id_id_key" ON "hostel_fee_rules"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_fee_rules_tenant_id_hostel_id_room_type_academic_ses_key" ON "hostel_fee_rules"("tenant_id", "hostel_id", "room_type", "academic_session_id", "fee_category_id");

-- CreateIndex
CREATE INDEX "fee_invoices_tenant_id_hostel_fee_rule_id_idx" ON "fee_invoices"("tenant_id", "hostel_fee_rule_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_invoices_tenant_id_student_id_hostel_fee_rule_id_billin_key" ON "fee_invoices"("tenant_id", "student_id", "hostel_fee_rule_id", "billing_period");

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_tenant_id_hostel_fee_rule_id_fkey" FOREIGN KEY ("tenant_id", "hostel_fee_rule_id") REFERENCES "hostel_fee_rules"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostels" ADD CONSTRAINT "hostels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostels" ADD CONSTRAINT "hostels_tenant_id_school_id_fkey" FOREIGN KEY ("tenant_id", "school_id") REFERENCES "schools"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_buildings" ADD CONSTRAINT "hostel_buildings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_buildings" ADD CONSTRAINT "hostel_buildings_tenant_id_hostel_id_fkey" FOREIGN KEY ("tenant_id", "hostel_id") REFERENCES "hostels"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_floors" ADD CONSTRAINT "hostel_floors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_floors" ADD CONSTRAINT "hostel_floors_tenant_id_building_id_fkey" FOREIGN KEY ("tenant_id", "building_id") REFERENCES "hostel_buildings"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_wings" ADD CONSTRAINT "hostel_wings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_wings" ADD CONSTRAINT "hostel_wings_tenant_id_building_id_fkey" FOREIGN KEY ("tenant_id", "building_id") REFERENCES "hostel_buildings"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_rooms" ADD CONSTRAINT "hostel_rooms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_rooms" ADD CONSTRAINT "hostel_rooms_tenant_id_floor_id_fkey" FOREIGN KEY ("tenant_id", "floor_id") REFERENCES "hostel_floors"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_rooms" ADD CONSTRAINT "hostel_rooms_tenant_id_wing_id_fkey" FOREIGN KEY ("tenant_id", "wing_id") REFERENCES "hostel_wings"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_beds" ADD CONSTRAINT "hostel_beds_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_beds" ADD CONSTRAINT "hostel_beds_tenant_id_room_id_fkey" FOREIGN KEY ("tenant_id", "room_id") REFERENCES "hostel_rooms"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_hostel_assignments" ADD CONSTRAINT "student_hostel_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_hostel_assignments" ADD CONSTRAINT "student_hostel_assignments_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_hostel_assignments" ADD CONSTRAINT "student_hostel_assignments_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_hostel_assignments" ADD CONSTRAINT "student_hostel_assignments_tenant_id_room_id_fkey" FOREIGN KEY ("tenant_id", "room_id") REFERENCES "hostel_rooms"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_hostel_assignments" ADD CONSTRAINT "student_hostel_assignments_tenant_id_bed_id_fkey" FOREIGN KEY ("tenant_id", "bed_id") REFERENCES "hostel_beds"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_attendance" ADD CONSTRAINT "hostel_attendance_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_attendance" ADD CONSTRAINT "hostel_attendance_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_attendance" ADD CONSTRAINT "hostel_attendance_tenant_id_student_hostel_assignment_id_fkey" FOREIGN KEY ("tenant_id", "student_hostel_assignment_id") REFERENCES "student_hostel_assignments"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_attendance" ADD CONSTRAINT "hostel_attendance_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_attendance" ADD CONSTRAINT "hostel_attendance_tenant_id_room_id_fkey" FOREIGN KEY ("tenant_id", "room_id") REFERENCES "hostel_rooms"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_leave_requests" ADD CONSTRAINT "hostel_leave_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_leave_requests" ADD CONSTRAINT "hostel_leave_requests_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_leave_requests" ADD CONSTRAINT "hostel_leave_requests_tenant_id_student_hostel_assignment__fkey" FOREIGN KEY ("tenant_id", "student_hostel_assignment_id") REFERENCES "student_hostel_assignments"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_visitors" ADD CONSTRAINT "hostel_visitors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_visitors" ADD CONSTRAINT "hostel_visitors_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mess_meal_plans" ADD CONSTRAINT "mess_meal_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mess_meal_plans" ADD CONSTRAINT "mess_meal_plans_tenant_id_hostel_id_fkey" FOREIGN KEY ("tenant_id", "hostel_id") REFERENCES "hostels"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mess_meals" ADD CONSTRAINT "mess_meals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mess_meals" ADD CONSTRAINT "mess_meals_tenant_id_meal_plan_id_fkey" FOREIGN KEY ("tenant_id", "meal_plan_id") REFERENCES "mess_meal_plans"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_fee_rules" ADD CONSTRAINT "hostel_fee_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_fee_rules" ADD CONSTRAINT "hostel_fee_rules_tenant_id_hostel_id_fkey" FOREIGN KEY ("tenant_id", "hostel_id") REFERENCES "hostels"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_fee_rules" ADD CONSTRAINT "hostel_fee_rules_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_fee_rules" ADD CONSTRAINT "hostel_fee_rules_tenant_id_fee_category_id_fkey" FOREIGN KEY ("tenant_id", "fee_category_id") REFERENCES "fee_categories"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;


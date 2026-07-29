-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BUS', 'MINI_BUS', 'VAN', 'OTHER');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('DIESEL', 'PETROL', 'CNG', 'ELECTRIC', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'BREAKDOWN', 'INACTIVE');

-- CreateEnum
CREATE TYPE "StudentTransportTripType" AS ENUM ('PICKUP_ONLY', 'DROP_ONLY', 'PICKUP_AND_DROP');

-- CreateEnum
CREATE TYPE "StudentTransportAssignmentStatus" AS ENUM ('ACTIVE', 'TEMPORARY_STOP', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "TransportTripLeg" AS ENUM ('PICKUP', 'DROP');

-- CreateEnum
CREATE TYPE "TransportAttendanceStatus" AS ENUM ('BOARDED', 'ABSENT', 'LATE');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TRANSPORT_ALERT';

-- AlterTable
ALTER TABLE "fee_invoices" ADD COLUMN     "route_fee_rule_id" UUID,
ALTER COLUMN "fee_structure_item_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "registration_number" TEXT NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "manufacture_year" INTEGER,
    "seating_capacity" INTEGER NOT NULL,
    "fuel_type" "FuelType",
    "insurance_expiry_date" DATE,
    "fitness_expiry_date" DATE,
    "permit_expiry_date" DATE,
    "pollution_expiry_date" DATE,
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "gps_device_id" TEXT,
    "last_known_latitude" DECIMAL(9,6),
    "last_known_longitude" DECIMAL(9,6),
    "last_location_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_profile_id" UUID,
    "employee_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "license_number" TEXT NOT NULL,
    "license_type" TEXT,
    "license_expiry_date" DATE,
    "date_of_joining" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_profile_id" UUID,
    "employee_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "date_of_joining" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "helpers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stops" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sequence_order" INTEGER NOT NULL,
    "pickup_time" TIME,
    "drop_time" TIME,
    "landmark" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_assignments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "helper_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "vehicle_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_transport_assignments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "stop_id" UUID NOT NULL,
    "trip_type" "StudentTransportTripType" NOT NULL DEFAULT 'PICKUP_AND_DROP',
    "status" "StudentTransportAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "student_transport_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_fee_rules" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
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

    CONSTRAINT "route_fee_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_attendance" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "student_transport_assignment_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "stop_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "trip_leg" "TransportTripLeg" NOT NULL,
    "status" "TransportAttendanceStatus" NOT NULL,
    "remarks" TEXT,
    "marked_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "transport_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicles_tenant_id_status_idx" ON "vehicles"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_tenant_id_id_key" ON "vehicles"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_tenant_id_registration_number_key" ON "vehicles"("tenant_id", "registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_user_profile_id_key" ON "drivers"("user_profile_id");

-- CreateIndex
CREATE INDEX "drivers_tenant_id_is_active_idx" ON "drivers"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_tenant_id_id_key" ON "drivers"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_tenant_id_user_profile_id_key" ON "drivers"("tenant_id", "user_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_tenant_id_employee_code_key" ON "drivers"("tenant_id", "employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "helpers_user_profile_id_key" ON "helpers"("user_profile_id");

-- CreateIndex
CREATE INDEX "helpers_tenant_id_is_active_idx" ON "helpers"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "helpers_tenant_id_id_key" ON "helpers"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "helpers_tenant_id_user_profile_id_key" ON "helpers"("tenant_id", "user_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "helpers_tenant_id_employee_code_key" ON "helpers"("tenant_id", "employee_code");

-- CreateIndex
CREATE INDEX "routes_tenant_id_school_id_idx" ON "routes"("tenant_id", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "routes_tenant_id_id_key" ON "routes"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "routes_tenant_id_code_key" ON "routes"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "route_stops_tenant_id_route_id_idx" ON "route_stops"("tenant_id", "route_id");

-- CreateIndex
CREATE UNIQUE INDEX "route_stops_tenant_id_id_key" ON "route_stops"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "route_stops_tenant_id_route_id_sequence_order_key" ON "route_stops"("tenant_id", "route_id", "sequence_order");

-- CreateIndex
CREATE INDEX "vehicle_assignments_tenant_id_driver_id_idx" ON "vehicle_assignments"("tenant_id", "driver_id");

-- CreateIndex
CREATE INDEX "vehicle_assignments_tenant_id_helper_id_idx" ON "vehicle_assignments"("tenant_id", "helper_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_assignments_tenant_id_id_key" ON "vehicle_assignments"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_assignments_tenant_id_route_id_academic_session_id_key" ON "vehicle_assignments"("tenant_id", "route_id", "academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_assignments_tenant_id_vehicle_id_academic_session_i_key" ON "vehicle_assignments"("tenant_id", "vehicle_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "student_transport_assignments_tenant_id_route_id_idx" ON "student_transport_assignments"("tenant_id", "route_id");

-- CreateIndex
CREATE INDEX "student_transport_assignments_tenant_id_stop_id_idx" ON "student_transport_assignments"("tenant_id", "stop_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_transport_assignments_tenant_id_id_key" ON "student_transport_assignments"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "student_transport_assignments_tenant_id_student_id_academic_key" ON "student_transport_assignments"("tenant_id", "student_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "route_fee_rules_tenant_id_academic_session_id_idx" ON "route_fee_rules"("tenant_id", "academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "route_fee_rules_tenant_id_id_key" ON "route_fee_rules"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "route_fee_rules_tenant_id_route_id_academic_session_id_fee__key" ON "route_fee_rules"("tenant_id", "route_id", "academic_session_id", "fee_category_id");

-- CreateIndex
CREATE INDEX "transport_attendance_tenant_id_route_id_date_idx" ON "transport_attendance"("tenant_id", "route_id", "date");

-- CreateIndex
CREATE INDEX "transport_attendance_tenant_id_vehicle_id_date_idx" ON "transport_attendance"("tenant_id", "vehicle_id", "date");

-- CreateIndex
CREATE INDEX "transport_attendance_tenant_id_student_transport_assignment_idx" ON "transport_attendance"("tenant_id", "student_transport_assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "transport_attendance_tenant_id_student_id_date_trip_leg_key" ON "transport_attendance"("tenant_id", "student_id", "date", "trip_leg");

-- CreateIndex
CREATE INDEX "fee_invoices_tenant_id_route_fee_rule_id_idx" ON "fee_invoices"("tenant_id", "route_fee_rule_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_invoices_tenant_id_student_id_route_fee_rule_id_billing_key" ON "fee_invoices"("tenant_id", "student_id", "route_fee_rule_id", "billing_period");

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_tenant_id_route_fee_rule_id_fkey" FOREIGN KEY ("tenant_id", "route_fee_rule_id") REFERENCES "route_fee_rules"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_tenant_id_user_profile_id_fkey" FOREIGN KEY ("tenant_id", "user_profile_id") REFERENCES "user_profiles"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpers" ADD CONSTRAINT "helpers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpers" ADD CONSTRAINT "helpers_tenant_id_user_profile_id_fkey" FOREIGN KEY ("tenant_id", "user_profile_id") REFERENCES "user_profiles"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_tenant_id_school_id_fkey" FOREIGN KEY ("tenant_id", "school_id") REFERENCES "schools"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_tenant_id_route_id_fkey" FOREIGN KEY ("tenant_id", "route_id") REFERENCES "routes"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_tenant_id_route_id_fkey" FOREIGN KEY ("tenant_id", "route_id") REFERENCES "routes"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_tenant_id_vehicle_id_fkey" FOREIGN KEY ("tenant_id", "vehicle_id") REFERENCES "vehicles"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_tenant_id_driver_id_fkey" FOREIGN KEY ("tenant_id", "driver_id") REFERENCES "drivers"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_tenant_id_helper_id_fkey" FOREIGN KEY ("tenant_id", "helper_id") REFERENCES "helpers"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_transport_assignments" ADD CONSTRAINT "student_transport_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_transport_assignments" ADD CONSTRAINT "student_transport_assignments_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_transport_assignments" ADD CONSTRAINT "student_transport_assignments_tenant_id_academic_session_i_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_transport_assignments" ADD CONSTRAINT "student_transport_assignments_tenant_id_route_id_fkey" FOREIGN KEY ("tenant_id", "route_id") REFERENCES "routes"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_transport_assignments" ADD CONSTRAINT "student_transport_assignments_tenant_id_stop_id_fkey" FOREIGN KEY ("tenant_id", "stop_id") REFERENCES "route_stops"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_fee_rules" ADD CONSTRAINT "route_fee_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_fee_rules" ADD CONSTRAINT "route_fee_rules_tenant_id_route_id_fkey" FOREIGN KEY ("tenant_id", "route_id") REFERENCES "routes"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_fee_rules" ADD CONSTRAINT "route_fee_rules_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_fee_rules" ADD CONSTRAINT "route_fee_rules_tenant_id_fee_category_id_fkey" FOREIGN KEY ("tenant_id", "fee_category_id") REFERENCES "fee_categories"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_attendance" ADD CONSTRAINT "transport_attendance_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_attendance" ADD CONSTRAINT "transport_attendance_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_attendance" ADD CONSTRAINT "transport_attendance_tenant_id_student_transport_assignmen_fkey" FOREIGN KEY ("tenant_id", "student_transport_assignment_id") REFERENCES "student_transport_assignments"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_attendance" ADD CONSTRAINT "transport_attendance_tenant_id_route_id_fkey" FOREIGN KEY ("tenant_id", "route_id") REFERENCES "routes"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_attendance" ADD CONSTRAINT "transport_attendance_tenant_id_stop_id_fkey" FOREIGN KEY ("tenant_id", "stop_id") REFERENCES "route_stops"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_attendance" ADD CONSTRAINT "transport_attendance_tenant_id_vehicle_id_fkey" FOREIGN KEY ("tenant_id", "vehicle_id") REFERENCES "vehicles"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- CreateEnum
CREATE TYPE "FeeFrequency" AS ENUM ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'INSTALLMENT');

-- CreateEnum
CREATE TYPE "FeeInvoiceStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'WAIVED');

-- CreateEnum
CREATE TYPE "FeePaymentMode" AS ENUM ('CASH', 'CHEQUE', 'UPI', 'CARD', 'BANK_TRANSFER', 'ONLINE');

-- CreateEnum
CREATE TYPE "FeePaymentStatus" AS ENUM ('COMPLETED', 'REVERSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FeeConcessionType" AS ENUM ('DISCOUNT', 'SCHOLARSHIP', 'CONCESSION', 'WAIVER', 'SIBLING', 'STAFF_WARD', 'OTHER');

-- CreateEnum
CREATE TYPE "FeeConcessionValueType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "FineType" AS ENUM ('FLAT', 'PERCENTAGE', 'PER_DAY');

-- CreateEnum
CREATE TYPE "FeeNumberSequenceType" AS ENUM ('INVOICE', 'RECEIPT');

-- CreateEnum
CREATE TYPE "FeeLedgerEntryType" AS ENUM ('INVOICE', 'PAYMENT', 'CONCESSION', 'REVERSAL', 'CANCELLATION', 'FINE');

-- CreateTable
CREATE TABLE "fee_categories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "hsn_sac_code" TEXT,
    "tax_rate_percent" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "fee_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_structures" (
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

    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_structure_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "fee_structure_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "fee_category_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "frequency" "FeeFrequency" NOT NULL,
    "due_day_of_month" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "fee_structure_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_fee_assignments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "fee_structure_id" UUID NOT NULL,
    "installment_plan_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "student_fee_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installment_plans" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "installment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installment_plan_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "installment_plan_id" UUID NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "percentage_of_total" DECIMAL(5,2) NOT NULL,
    "due_day_offset" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "installment_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fine_rules" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "fee_category_id" UUID,
    "name" TEXT NOT NULL,
    "grace_period_days" INTEGER NOT NULL,
    "fine_type" "FineType" NOT NULL,
    "fine_value" DECIMAL(12,2) NOT NULL,
    "max_fine_amount" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "fine_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_concessions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "fee_category_id" UUID,
    "type" "FeeConcessionType" NOT NULL,
    "value_type" "FeeConcessionValueType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "fee_concessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_number_sequences" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "type" "FeeNumberSequenceType" NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT '',
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "fee_number_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_invoices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "fee_category_id" UUID NOT NULL,
    "fee_structure_item_id" UUID NOT NULL,
    "installment_plan_id" UUID,
    "installment_number" INTEGER,
    "applied_concession_id" UUID,
    "invoice_number" TEXT NOT NULL,
    "billing_period" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fine_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amount_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2),
    "due_date" DATE NOT NULL,
    "status" "FeeInvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "cancelled_at" TIMESTAMPTZ(3),
    "cancelled_by" UUID,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "fee_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_payments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "client_request_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_mode" "FeePaymentMode" NOT NULL,
    "status" "FeePaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "paid_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collected_by" UUID,
    "remarks" TEXT,
    "gateway_provider" TEXT,
    "gateway_transaction_id" TEXT,
    "gateway_order_id" TEXT,
    "gateway_payload" JSONB,
    "reversed_at" TIMESTAMPTZ(3),
    "reversed_by" UUID,
    "reversal_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_payment_allocations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "amount_allocated" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "before_state" JSONB,
    "after_state" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_ledger_entries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "entry_type" "FeeLedgerEntryType" NOT NULL,
    "reference_type" TEXT NOT NULL,
    "reference_id" UUID NOT NULL,
    "debit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance_after" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "fee_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fee_categories_tenant_id_school_id_idx" ON "fee_categories"("tenant_id", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_categories_tenant_id_id_key" ON "fee_categories"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_categories_tenant_id_code_key" ON "fee_categories"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "fee_structures_tenant_id_academic_session_id_idx" ON "fee_structures"("tenant_id", "academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_structures_tenant_id_id_key" ON "fee_structures"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_structures_tenant_id_academic_session_id_name_key" ON "fee_structures"("tenant_id", "academic_session_id", "name");

-- CreateIndex
CREATE INDEX "fee_structure_items_tenant_id_fee_structure_id_idx" ON "fee_structure_items"("tenant_id", "fee_structure_id");

-- CreateIndex
CREATE INDEX "fee_structure_items_tenant_id_class_id_idx" ON "fee_structure_items"("tenant_id", "class_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_structure_items_tenant_id_id_key" ON "fee_structure_items"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_structure_items_tenant_id_fee_structure_id_class_id_fee_key" ON "fee_structure_items"("tenant_id", "fee_structure_id", "class_id", "fee_category_id");

-- CreateIndex
CREATE INDEX "student_fee_assignments_tenant_id_fee_structure_id_idx" ON "student_fee_assignments"("tenant_id", "fee_structure_id");

-- CreateIndex
CREATE INDEX "student_fee_assignments_tenant_id_installment_plan_id_idx" ON "student_fee_assignments"("tenant_id", "installment_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_fee_assignments_tenant_id_id_key" ON "student_fee_assignments"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "student_fee_assignments_tenant_id_student_id_academic_sessi_key" ON "student_fee_assignments"("tenant_id", "student_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "installment_plans_tenant_id_academic_session_id_idx" ON "installment_plans"("tenant_id", "academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "installment_plans_tenant_id_id_key" ON "installment_plans"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "installment_plans_tenant_id_academic_session_id_name_key" ON "installment_plans"("tenant_id", "academic_session_id", "name");

-- CreateIndex
CREATE INDEX "installment_plan_items_tenant_id_installment_plan_id_idx" ON "installment_plan_items"("tenant_id", "installment_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "installment_plan_items_tenant_id_id_key" ON "installment_plan_items"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "installment_plan_items_tenant_id_installment_plan_id_instal_key" ON "installment_plan_items"("tenant_id", "installment_plan_id", "installment_number");

-- CreateIndex
CREATE INDEX "fine_rules_tenant_id_academic_session_id_idx" ON "fine_rules"("tenant_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "fine_rules_tenant_id_fee_category_id_idx" ON "fine_rules"("tenant_id", "fee_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "fine_rules_tenant_id_id_key" ON "fine_rules"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "fee_concessions_tenant_id_student_id_idx" ON "fee_concessions"("tenant_id", "student_id");

-- CreateIndex
CREATE INDEX "fee_concessions_tenant_id_academic_session_id_idx" ON "fee_concessions"("tenant_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "fee_concessions_tenant_id_fee_category_id_idx" ON "fee_concessions"("tenant_id", "fee_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_concessions_tenant_id_id_key" ON "fee_concessions"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_number_sequences_tenant_id_id_key" ON "fee_number_sequences"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_number_sequences_tenant_id_academic_session_id_type_key" ON "fee_number_sequences"("tenant_id", "academic_session_id", "type");

-- CreateIndex
CREATE INDEX "fee_invoices_tenant_id_student_id_idx" ON "fee_invoices"("tenant_id", "student_id");

-- CreateIndex
CREATE INDEX "fee_invoices_tenant_id_class_id_status_idx" ON "fee_invoices"("tenant_id", "class_id", "status");

-- CreateIndex
CREATE INDEX "fee_invoices_tenant_id_academic_session_id_status_idx" ON "fee_invoices"("tenant_id", "academic_session_id", "status");

-- CreateIndex
CREATE INDEX "fee_invoices_tenant_id_due_date_idx" ON "fee_invoices"("tenant_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "fee_invoices_tenant_id_id_key" ON "fee_invoices"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_invoices_tenant_id_invoice_number_key" ON "fee_invoices"("tenant_id", "invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "fee_invoices_tenant_id_student_id_fee_structure_item_id_bil_key" ON "fee_invoices"("tenant_id", "student_id", "fee_structure_item_id", "billing_period");

-- CreateIndex
CREATE INDEX "fee_payments_tenant_id_student_id_idx" ON "fee_payments"("tenant_id", "student_id");

-- CreateIndex
CREATE INDEX "fee_payments_tenant_id_academic_session_id_paid_at_idx" ON "fee_payments"("tenant_id", "academic_session_id", "paid_at");

-- CreateIndex
CREATE INDEX "fee_payments_tenant_id_collected_by_paid_at_idx" ON "fee_payments"("tenant_id", "collected_by", "paid_at");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_tenant_id_id_key" ON "fee_payments"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_tenant_id_receipt_number_key" ON "fee_payments"("tenant_id", "receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_tenant_id_client_request_id_key" ON "fee_payments"("tenant_id", "client_request_id");

-- CreateIndex
CREATE INDEX "fee_payment_allocations_tenant_id_invoice_id_idx" ON "fee_payment_allocations"("tenant_id", "invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payment_allocations_tenant_id_id_key" ON "fee_payment_allocations"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payment_allocations_tenant_id_payment_id_invoice_id_key" ON "fee_payment_allocations"("tenant_id", "payment_id", "invoice_id");

-- CreateIndex
CREATE INDEX "fee_audit_logs_tenant_id_entity_type_entity_id_idx" ON "fee_audit_logs"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "fee_audit_logs_tenant_id_created_at_idx" ON "fee_audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "fee_ledger_entries_tenant_id_student_id_created_at_idx" ON "fee_ledger_entries"("tenant_id", "student_id", "created_at");

-- CreateIndex
CREATE INDEX "fee_ledger_entries_tenant_id_academic_session_id_idx" ON "fee_ledger_entries"("tenant_id", "academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_ledger_entries_tenant_id_id_key" ON "fee_ledger_entries"("tenant_id", "id");

-- AddForeignKey
ALTER TABLE "fee_categories" ADD CONSTRAINT "fee_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_categories" ADD CONSTRAINT "fee_categories_tenant_id_school_id_fkey" FOREIGN KEY ("tenant_id", "school_id") REFERENCES "schools"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structure_items" ADD CONSTRAINT "fee_structure_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structure_items" ADD CONSTRAINT "fee_structure_items_tenant_id_fee_structure_id_fkey" FOREIGN KEY ("tenant_id", "fee_structure_id") REFERENCES "fee_structures"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structure_items" ADD CONSTRAINT "fee_structure_items_tenant_id_class_id_fkey" FOREIGN KEY ("tenant_id", "class_id") REFERENCES "classes"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structure_items" ADD CONSTRAINT "fee_structure_items_tenant_id_fee_category_id_fkey" FOREIGN KEY ("tenant_id", "fee_category_id") REFERENCES "fee_categories"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_tenant_id_fee_structure_id_fkey" FOREIGN KEY ("tenant_id", "fee_structure_id") REFERENCES "fee_structures"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_tenant_id_installment_plan_id_fkey" FOREIGN KEY ("tenant_id", "installment_plan_id") REFERENCES "installment_plans"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installment_plan_items" ADD CONSTRAINT "installment_plan_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installment_plan_items" ADD CONSTRAINT "installment_plan_items_tenant_id_installment_plan_id_fkey" FOREIGN KEY ("tenant_id", "installment_plan_id") REFERENCES "installment_plans"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fine_rules" ADD CONSTRAINT "fine_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fine_rules" ADD CONSTRAINT "fine_rules_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fine_rules" ADD CONSTRAINT "fine_rules_tenant_id_fee_category_id_fkey" FOREIGN KEY ("tenant_id", "fee_category_id") REFERENCES "fee_categories"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_concessions" ADD CONSTRAINT "fee_concessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_concessions" ADD CONSTRAINT "fee_concessions_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_concessions" ADD CONSTRAINT "fee_concessions_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_concessions" ADD CONSTRAINT "fee_concessions_tenant_id_fee_category_id_fkey" FOREIGN KEY ("tenant_id", "fee_category_id") REFERENCES "fee_categories"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_number_sequences" ADD CONSTRAINT "fee_number_sequences_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_number_sequences" ADD CONSTRAINT "fee_number_sequences_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_tenant_id_class_id_fkey" FOREIGN KEY ("tenant_id", "class_id") REFERENCES "classes"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_tenant_id_fee_category_id_fkey" FOREIGN KEY ("tenant_id", "fee_category_id") REFERENCES "fee_categories"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_tenant_id_fee_structure_item_id_fkey" FOREIGN KEY ("tenant_id", "fee_structure_item_id") REFERENCES "fee_structure_items"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_tenant_id_installment_plan_id_fkey" FOREIGN KEY ("tenant_id", "installment_plan_id") REFERENCES "installment_plans"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_tenant_id_applied_concession_id_fkey" FOREIGN KEY ("tenant_id", "applied_concession_id") REFERENCES "fee_concessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payment_allocations" ADD CONSTRAINT "fee_payment_allocations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payment_allocations" ADD CONSTRAINT "fee_payment_allocations_tenant_id_payment_id_fkey" FOREIGN KEY ("tenant_id", "payment_id") REFERENCES "fee_payments"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payment_allocations" ADD CONSTRAINT "fee_payment_allocations_tenant_id_invoice_id_fkey" FOREIGN KEY ("tenant_id", "invoice_id") REFERENCES "fee_invoices"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_audit_logs" ADD CONSTRAINT "fee_audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_ledger_entries" ADD CONSTRAINT "fee_ledger_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_ledger_entries" ADD CONSTRAINT "fee_ledger_entries_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_ledger_entries" ADD CONSTRAINT "fee_ledger_entries_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

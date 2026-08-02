-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "BillingRunStatus" AS ENUM ('DRAFT', 'PROCESSED', 'LOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentGatewayProviderCode" AS ENUM ('RAZORPAY', 'PHONEPE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('RECEIVED', 'VERIFIED', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "PlanFeatureValueType" AS ENUM ('BOOLEAN', 'LIMIT');

-- CreateTable
CREATE TABLE "subscription_plan_definitions" (
    "id" UUID NOT NULL,
    "plan_code" "SubscriptionPlan" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthly_price" DECIMAL(10,2) NOT NULL,
    "annual_price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "trial_days" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "subscription_plan_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_feature_entitlements" (
    "id" UUID NOT NULL,
    "subscription_plan_definition_id" UUID NOT NULL,
    "feature_key" TEXT NOT NULL,
    "value_type" "PlanFeatureValueType" NOT NULL,
    "boolean_value" BOOLEAN,
    "limit_value" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "plan_feature_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "subscription_plan_definition_id" UUID NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "billing_cycle" "BillingCycle" NOT NULL,
    "price_at_assignment" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "trial_ends_at" TIMESTAMPTZ(3),
    "current_period_start" DATE NOT NULL,
    "current_period_end" DATE NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "gateway_subscription_id" TEXT,
    "cancelled_at" TIMESTAMPTZ(3),
    "cancelled_by" UUID,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_invoices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "billing_run_id" UUID,
    "invoice_number" TEXT NOT NULL,
    "billing_period" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "plan_at_invoice" "SubscriptionPlan" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "SubscriptionInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issued_at" TIMESTAMPTZ(3),
    "due_date" DATE NOT NULL,
    "paid_at" TIMESTAMPTZ(3),
    "storage_key" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "subscription_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "subscription_invoice_id" UUID NOT NULL,
    "gateway_provider" "PaymentGatewayProviderCode" NOT NULL,
    "gateway_order_id" TEXT NOT NULL,
    "gateway_payment_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "method" TEXT,
    "gateway_response_snapshot" JSONB,
    "failure_reason" TEXT,
    "refunded_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "captured_at" TIMESTAMPTZ(3),
    "refunded_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_runs" (
    "id" UUID NOT NULL,
    "billing_period" TEXT NOT NULL,
    "status" "BillingRunStatus" NOT NULL DEFAULT 'DRAFT',
    "processed_at" TIMESTAMPTZ(3),
    "processed_by" UUID,
    "locked_at" TIMESTAMPTZ(3),
    "locked_by" UUID,
    "total_invoices_generated" INTEGER NOT NULL DEFAULT 0,
    "total_amount_billed" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "billing_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "gateway_provider" "PaymentGatewayProviderCode" NOT NULL,
    "event_type" TEXT NOT NULL,
    "gateway_event_id" TEXT NOT NULL,
    "payload_snapshot" JSONB NOT NULL,
    "signature_verified" BOOLEAN NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "related_payment_id" UUID,
    "processing_error" TEXT,
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(3),

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "before_state" JSONB,
    "after_state" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_invoice_sequences" (
    "id" UUID NOT NULL,
    "financial_year" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT '',
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "platform_invoice_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_definitions_plan_code_key" ON "subscription_plan_definitions"("plan_code");

-- CreateIndex
CREATE UNIQUE INDEX "plan_feature_entitlements_subscription_plan_definition_id_f_key" ON "plan_feature_entitlements"("subscription_plan_definition_id", "feature_key");

-- CreateIndex
CREATE INDEX "subscriptions_tenant_id_effective_to_idx" ON "subscriptions"("tenant_id", "effective_to");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_tenant_id_id_key" ON "subscriptions"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "subscription_invoices_tenant_id_status_idx" ON "subscription_invoices"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "subscription_invoices_status_due_date_idx" ON "subscription_invoices"("status", "due_date");

-- CreateIndex
CREATE INDEX "subscription_invoices_billing_run_id_idx" ON "subscription_invoices"("billing_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_invoices_tenant_id_id_key" ON "subscription_invoices"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_invoices_tenant_id_invoice_number_key" ON "subscription_invoices"("tenant_id", "invoice_number");

-- CreateIndex
CREATE INDEX "payments_tenant_id_status_idx" ON "payments"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "payments_subscription_invoice_id_idx" ON "payments"("subscription_invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_tenant_id_id_key" ON "payments"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gateway_provider_gateway_order_id_key" ON "payments"("gateway_provider", "gateway_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gateway_provider_gateway_payment_id_key" ON "payments"("gateway_provider", "gateway_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_runs_billing_period_key" ON "billing_runs"("billing_period");

-- CreateIndex
CREATE INDEX "webhook_events_status_received_at_idx" ON "webhook_events"("status", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_gateway_provider_gateway_event_id_key" ON "webhook_events"("gateway_provider", "gateway_event_id");

-- CreateIndex
CREATE INDEX "platform_audit_logs_tenant_id_entity_type_entity_id_idx" ON "platform_audit_logs"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "platform_audit_logs_created_at_idx" ON "platform_audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "platform_invoice_sequences_financial_year_key" ON "platform_invoice_sequences"("financial_year");

-- AddForeignKey
ALTER TABLE "plan_feature_entitlements" ADD CONSTRAINT "plan_feature_entitlements_subscription_plan_definition_id_fkey" FOREIGN KEY ("subscription_plan_definition_id") REFERENCES "subscription_plan_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_subscription_plan_definition_id_fkey" FOREIGN KEY ("subscription_plan_definition_id") REFERENCES "subscription_plan_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_tenant_id_subscription_id_fkey" FOREIGN KEY ("tenant_id", "subscription_id") REFERENCES "subscriptions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_billing_run_id_fkey" FOREIGN KEY ("billing_run_id") REFERENCES "billing_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_subscription_invoice_id_fkey" FOREIGN KEY ("tenant_id", "subscription_invoice_id") REFERENCES "subscription_invoices"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_related_payment_id_fkey" FOREIGN KEY ("related_payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


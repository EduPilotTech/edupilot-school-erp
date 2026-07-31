-- CreateEnum
CREATE TYPE "FinanceAccountType" AS ENUM ('CASH', 'BANK');

-- CreateEnum
CREATE TYPE "FinancePaymentMode" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'CARD', 'OTHER');

-- CreateTable
CREATE TABLE "finance_accounts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "account_type" "FinanceAccountType" NOT NULL,
    "opening_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "current_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "finance_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_categories" (
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

    CONSTRAINT "income_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
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

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_entries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "income_category_id" UUID NOT NULL,
    "finance_account_id" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,
    "reference_no" TEXT,
    "collected_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "income_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_entries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "expense_category_id" UUID NOT NULL,
    "finance_account_id" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "date" DATE NOT NULL,
    "vendor" TEXT,
    "description" TEXT,
    "payment_mode" "FinancePaymentMode" NOT NULL,
    "reference_no" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "expense_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finance_accounts_tenant_id_school_id_idx" ON "finance_accounts"("tenant_id", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_accounts_tenant_id_id_key" ON "finance_accounts"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "income_categories_tenant_id_school_id_idx" ON "income_categories"("tenant_id", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "income_categories_tenant_id_id_key" ON "income_categories"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "income_categories_tenant_id_code_key" ON "income_categories"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "expense_categories_tenant_id_school_id_idx" ON "expense_categories"("tenant_id", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_tenant_id_id_key" ON "expense_categories"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_tenant_id_code_key" ON "expense_categories"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "income_entries_tenant_id_school_id_date_idx" ON "income_entries"("tenant_id", "school_id", "date");

-- CreateIndex
CREATE INDEX "income_entries_tenant_id_academic_session_id_idx" ON "income_entries"("tenant_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "income_entries_tenant_id_income_category_id_idx" ON "income_entries"("tenant_id", "income_category_id");

-- CreateIndex
CREATE INDEX "income_entries_tenant_id_finance_account_id_idx" ON "income_entries"("tenant_id", "finance_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "income_entries_tenant_id_id_key" ON "income_entries"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "expense_entries_tenant_id_school_id_date_idx" ON "expense_entries"("tenant_id", "school_id", "date");

-- CreateIndex
CREATE INDEX "expense_entries_tenant_id_academic_session_id_idx" ON "expense_entries"("tenant_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "expense_entries_tenant_id_expense_category_id_idx" ON "expense_entries"("tenant_id", "expense_category_id");

-- CreateIndex
CREATE INDEX "expense_entries_tenant_id_finance_account_id_idx" ON "expense_entries"("tenant_id", "finance_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_entries_tenant_id_id_key" ON "expense_entries"("tenant_id", "id");

-- AddForeignKey
ALTER TABLE "finance_accounts" ADD CONSTRAINT "finance_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_accounts" ADD CONSTRAINT "finance_accounts_tenant_id_school_id_fkey" FOREIGN KEY ("tenant_id", "school_id") REFERENCES "schools"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_categories" ADD CONSTRAINT "income_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_categories" ADD CONSTRAINT "income_categories_tenant_id_school_id_fkey" FOREIGN KEY ("tenant_id", "school_id") REFERENCES "schools"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_tenant_id_school_id_fkey" FOREIGN KEY ("tenant_id", "school_id") REFERENCES "schools"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_tenant_id_school_id_fkey" FOREIGN KEY ("tenant_id", "school_id") REFERENCES "schools"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_tenant_id_income_category_id_fkey" FOREIGN KEY ("tenant_id", "income_category_id") REFERENCES "income_categories"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_tenant_id_finance_account_id_fkey" FOREIGN KEY ("tenant_id", "finance_account_id") REFERENCES "finance_accounts"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_tenant_id_school_id_fkey" FOREIGN KEY ("tenant_id", "school_id") REFERENCES "schools"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_tenant_id_academic_session_id_fkey" FOREIGN KEY ("tenant_id", "academic_session_id") REFERENCES "academic_sessions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_tenant_id_expense_category_id_fkey" FOREIGN KEY ("tenant_id", "expense_category_id") REFERENCES "expense_categories"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_tenant_id_finance_account_id_fkey" FOREIGN KEY ("tenant_id", "finance_account_id") REFERENCES "finance_accounts"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;


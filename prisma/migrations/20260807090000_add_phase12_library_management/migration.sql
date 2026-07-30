-- CreateEnum
CREATE TYPE "LibraryMemberType" AS ENUM ('STUDENT', 'TEACHER', 'STAFF');

-- CreateEnum
CREATE TYPE "BookCopyStatus" AS ENUM ('AVAILABLE', 'ISSUED', 'RESERVED', 'LOST', 'DAMAGED');

-- CreateEnum
CREATE TYPE "BookIssueStatus" AS ENUM ('ISSUED', 'RETURNED', 'LOST', 'DAMAGED');

-- CreateEnum
CREATE TYPE "BookReservationStatus" AS ENUM ('PENDING', 'AVAILABLE', 'FULFILLED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "fee_invoices" ADD COLUMN     "book_issue_id" UUID;

-- CreateTable
CREATE TABLE "libraries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "libraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_settings" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "library_id" UUID NOT NULL,
    "default_loan_period_days" INTEGER NOT NULL DEFAULT 14,
    "max_books_student" INTEGER NOT NULL DEFAULT 3,
    "max_books_teacher" INTEGER NOT NULL DEFAULT 5,
    "max_books_staff" INTEGER NOT NULL DEFAULT 5,
    "max_renewal_count" INTEGER NOT NULL DEFAULT 2,
    "reservation_hold_days" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "library_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_categories" (
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

    CONSTRAINT "book_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authors" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "biography" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publishers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "publishers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "library_id" UUID NOT NULL,
    "book_category_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "publisher_id" UUID NOT NULL,
    "academic_subject_id" UUID,
    "title" TEXT NOT NULL,
    "isbn" TEXT,
    "language" TEXT NOT NULL,
    "edition" TEXT,
    "description" TEXT,
    "replacement_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "racks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "library_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "racks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelves" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "rack_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "shelves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_copies" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "shelf_id" UUID,
    "accession_number" TEXT NOT NULL,
    "status" "BookCopyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "book_copies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_issues" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "book_copy_id" UUID NOT NULL,
    "library_id" UUID NOT NULL,
    "member_type" "LibraryMemberType" NOT NULL,
    "member_id" UUID NOT NULL,
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "return_date" DATE,
    "status" "BookIssueStatus" NOT NULL DEFAULT 'ISSUED',
    "renewal_count" INTEGER NOT NULL DEFAULT 0,
    "issued_by" UUID,
    "returned_by" UUID,
    "fine_waived" BOOLEAN NOT NULL DEFAULT false,
    "fine_waived_by" UUID,
    "fine_waived_reason" TEXT,
    "fine_waived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "book_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_reservations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "member_type" "LibraryMemberType" NOT NULL,
    "member_id" UUID NOT NULL,
    "reservation_date" DATE NOT NULL,
    "status" "BookReservationStatus" NOT NULL DEFAULT 'PENDING',
    "notified_at" TIMESTAMPTZ(3),
    "fulfilled_book_issue_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "book_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "libraries_tenant_id_school_id_idx" ON "libraries"("tenant_id", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "libraries_tenant_id_id_key" ON "libraries"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "libraries_tenant_id_code_key" ON "libraries"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "library_settings_tenant_id_id_key" ON "library_settings"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "library_settings_tenant_id_library_id_key" ON "library_settings"("tenant_id", "library_id");

-- CreateIndex
CREATE INDEX "book_categories_tenant_id_school_id_idx" ON "book_categories"("tenant_id", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_categories_tenant_id_id_key" ON "book_categories"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "book_categories_tenant_id_code_key" ON "book_categories"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "authors_tenant_id_school_id_idx" ON "authors"("tenant_id", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "authors_tenant_id_id_key" ON "authors"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "publishers_tenant_id_school_id_idx" ON "publishers"("tenant_id", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "publishers_tenant_id_id_key" ON "publishers"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "books_tenant_id_library_id_idx" ON "books"("tenant_id", "library_id");

-- CreateIndex
CREATE INDEX "books_tenant_id_book_category_id_idx" ON "books"("tenant_id", "book_category_id");

-- CreateIndex
CREATE INDEX "books_tenant_id_author_id_idx" ON "books"("tenant_id", "author_id");

-- CreateIndex
CREATE INDEX "books_tenant_id_isbn_idx" ON "books"("tenant_id", "isbn");

-- CreateIndex
CREATE UNIQUE INDEX "books_tenant_id_id_key" ON "books"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "racks_tenant_id_library_id_idx" ON "racks"("tenant_id", "library_id");

-- CreateIndex
CREATE UNIQUE INDEX "racks_tenant_id_id_key" ON "racks"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "racks_tenant_id_library_id_code_key" ON "racks"("tenant_id", "library_id", "code");

-- CreateIndex
CREATE INDEX "shelves_tenant_id_rack_id_idx" ON "shelves"("tenant_id", "rack_id");

-- CreateIndex
CREATE UNIQUE INDEX "shelves_tenant_id_id_key" ON "shelves"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "shelves_tenant_id_rack_id_code_key" ON "shelves"("tenant_id", "rack_id", "code");

-- CreateIndex
CREATE INDEX "book_copies_tenant_id_book_id_idx" ON "book_copies"("tenant_id", "book_id");

-- CreateIndex
CREATE INDEX "book_copies_tenant_id_shelf_id_idx" ON "book_copies"("tenant_id", "shelf_id");

-- CreateIndex
CREATE INDEX "book_copies_tenant_id_status_idx" ON "book_copies"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "book_copies_tenant_id_id_key" ON "book_copies"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "book_copies_tenant_id_accession_number_key" ON "book_copies"("tenant_id", "accession_number");

-- CreateIndex
CREATE INDEX "book_issues_tenant_id_book_copy_id_status_idx" ON "book_issues"("tenant_id", "book_copy_id", "status");

-- CreateIndex
CREATE INDEX "book_issues_tenant_id_member_type_member_id_idx" ON "book_issues"("tenant_id", "member_type", "member_id");

-- CreateIndex
CREATE INDEX "book_issues_tenant_id_due_date_status_idx" ON "book_issues"("tenant_id", "due_date", "status");

-- CreateIndex
CREATE INDEX "book_issues_tenant_id_library_id_status_idx" ON "book_issues"("tenant_id", "library_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "book_issues_tenant_id_id_key" ON "book_issues"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "book_reservations_tenant_id_book_id_status_idx" ON "book_reservations"("tenant_id", "book_id", "status");

-- CreateIndex
CREATE INDEX "book_reservations_tenant_id_member_type_member_id_idx" ON "book_reservations"("tenant_id", "member_type", "member_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_reservations_tenant_id_id_key" ON "book_reservations"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "fee_invoices_tenant_id_book_issue_id_idx" ON "fee_invoices"("tenant_id", "book_issue_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_invoices_tenant_id_book_issue_id_key" ON "fee_invoices"("tenant_id", "book_issue_id");

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_tenant_id_book_issue_id_fkey" FOREIGN KEY ("tenant_id", "book_issue_id") REFERENCES "book_issues"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "libraries" ADD CONSTRAINT "libraries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "libraries" ADD CONSTRAINT "libraries_tenant_id_school_id_fkey" FOREIGN KEY ("tenant_id", "school_id") REFERENCES "schools"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_settings" ADD CONSTRAINT "library_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_settings" ADD CONSTRAINT "library_settings_tenant_id_library_id_fkey" FOREIGN KEY ("tenant_id", "library_id") REFERENCES "libraries"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_categories" ADD CONSTRAINT "book_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_categories" ADD CONSTRAINT "book_categories_tenant_id_school_id_fkey" FOREIGN KEY ("tenant_id", "school_id") REFERENCES "schools"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authors" ADD CONSTRAINT "authors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authors" ADD CONSTRAINT "authors_tenant_id_school_id_fkey" FOREIGN KEY ("tenant_id", "school_id") REFERENCES "schools"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publishers" ADD CONSTRAINT "publishers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publishers" ADD CONSTRAINT "publishers_tenant_id_school_id_fkey" FOREIGN KEY ("tenant_id", "school_id") REFERENCES "schools"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_tenant_id_library_id_fkey" FOREIGN KEY ("tenant_id", "library_id") REFERENCES "libraries"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_tenant_id_book_category_id_fkey" FOREIGN KEY ("tenant_id", "book_category_id") REFERENCES "book_categories"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_tenant_id_author_id_fkey" FOREIGN KEY ("tenant_id", "author_id") REFERENCES "authors"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_tenant_id_publisher_id_fkey" FOREIGN KEY ("tenant_id", "publisher_id") REFERENCES "publishers"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_tenant_id_academic_subject_id_fkey" FOREIGN KEY ("tenant_id", "academic_subject_id") REFERENCES "subjects"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "racks" ADD CONSTRAINT "racks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "racks" ADD CONSTRAINT "racks_tenant_id_library_id_fkey" FOREIGN KEY ("tenant_id", "library_id") REFERENCES "libraries"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelves" ADD CONSTRAINT "shelves_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelves" ADD CONSTRAINT "shelves_tenant_id_rack_id_fkey" FOREIGN KEY ("tenant_id", "rack_id") REFERENCES "racks"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_tenant_id_book_id_fkey" FOREIGN KEY ("tenant_id", "book_id") REFERENCES "books"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_tenant_id_shelf_id_fkey" FOREIGN KEY ("tenant_id", "shelf_id") REFERENCES "shelves"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_tenant_id_book_copy_id_fkey" FOREIGN KEY ("tenant_id", "book_copy_id") REFERENCES "book_copies"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_reservations" ADD CONSTRAINT "book_reservations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_reservations" ADD CONSTRAINT "book_reservations_tenant_id_book_id_fkey" FOREIGN KEY ("tenant_id", "book_id") REFERENCES "books"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_reservations" ADD CONSTRAINT "book_reservations_tenant_id_fulfilled_book_issue_id_fkey" FOREIGN KEY ("tenant_id", "fulfilled_book_issue_id") REFERENCES "book_issues"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;


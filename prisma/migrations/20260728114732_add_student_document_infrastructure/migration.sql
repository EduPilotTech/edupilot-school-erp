-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BIRTH_CERTIFICATE', 'TRANSFER_CERTIFICATE', 'MEDICAL_CERTIFICATE', 'CASTE_CERTIFICATE', 'INCOME_CERTIFICATE', 'AADHAAR', 'PHOTO', 'OTHER');

-- CreateTable
CREATE TABLE "student_documents" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "original_file_name" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "uploaded_by" UUID,

    CONSTRAINT "student_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_documents_tenant_id_idx" ON "student_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "student_documents_tenant_id_student_id_idx" ON "student_documents"("tenant_id", "student_id");

-- CreateIndex
CREATE INDEX "student_documents_tenant_id_student_id_document_type_idx" ON "student_documents"("tenant_id", "student_id", "document_type");

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

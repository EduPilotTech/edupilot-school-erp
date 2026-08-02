-- CreateTable
CREATE TABLE "school_branding" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "logo_key" TEXT,
    "signature_key" TEXT,
    "seal_key" TEXT,
    "header_text" TEXT,
    "footer_text" TEXT,
    "theme_color" TEXT,
    "motto" TEXT,
    "facebook_url" TEXT,
    "twitter_url" TEXT,
    "instagram_url" TEXT,
    "linkedin_url" TEXT,
    "youtube_url" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "school_branding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_branding_tenant_id_key" ON "school_branding"("tenant_id");

-- AddForeignKey
ALTER TABLE "school_branding" ADD CONSTRAINT "school_branding_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { StorageService, UploadFileInput } from "./storage-service";

// Uses the per-request, session-bound Supabase client (lib/supabase/server.ts) — deliberately
// NOT the admin/service-role client (lib/supabase/admin.ts). docs/SECURITY_GUIDELINES.md §5
// restricts the service-role client to `lib/supabase/admin.ts` itself, `modules/tenancy/
// infrastructure/` (tenant provisioning), and background job runners. Student document uploads
// are an ordinary per-tenant feature, not tenant provisioning — using the service-role client
// here would bypass Supabase Storage's own bucket/RLS policies entirely, the same category of
// shortcut §8 already forbids for a "generate report" feature ("must never use the admin/
// service-role client as a shortcut"). This means uploads are subject to whatever Storage
// policies exist on the target bucket, exactly as intended for tenant-isolated data.
//
// REQUIRES a Supabase Storage bucket (and appropriate Storage RLS policies) to be provisioned
// in the Supabase project before any of these calls will succeed at runtime — bucket/policy
// provisioning is outside this repository's scope (see Sprint 4.8A's final report).
export class SupabaseStorageService implements StorageService {
  async upload(input: UploadFileInput): Promise<{ key: string }> {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.storage.from(input.bucket).upload(input.key, input.file, {
      contentType: input.contentType,
      upsert: false,
    });

    if (error) {
      throw new Error(`Failed to upload file to storage: ${error.message}`);
    }

    return { key: input.key };
  }

  async delete(bucket: string, key: string): Promise<void> {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.storage.from(bucket).remove([key]);

    if (error) {
      throw new Error(`Failed to delete file from storage: ${error.message}`);
    }
  }

  async signedUrl(bucket: string, key: string, expiresInSeconds = 3600): Promise<string> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(key, expiresInSeconds);

    if (error || !data) {
      throw new Error(`Failed to create signed URL: ${error?.message ?? "unknown error"}`);
    }

    return data.signedUrl;
  }
}

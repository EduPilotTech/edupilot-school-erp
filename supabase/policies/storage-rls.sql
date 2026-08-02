-- Completion Pass — Storage RLS verification (checklist #14).
--
-- WHY THIS FILE EXISTS INSTEAD OF A MIGRATION: this repository's Prisma DATABASE_URL/DIRECT_URL
-- point at a separate, local Postgres instance used only for application data (Tenant, School,
-- SchoolBranding, etc.) — confirmed empirically: `select * from storage.buckets` against that
-- connection fails with "relation storage.buckets does not exist". Supabase Auth + Storage live
-- in a DIFFERENT, hosted Supabase project, reachable only via its REST/Admin APIs
-- (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) from this codebase and this deployment
-- environment — there is no direct Postgres connection to it here, and Supabase's Storage
-- client has no "create a policy" API (only bucket create/list/delete). Creating RLS policies
-- requires running SQL directly against the Supabase project, which means either the Supabase
-- Dashboard's SQL Editor or the Supabase CLI (`supabase db push` / `psql` against the project's
-- own connection string) — both are manual, one-time steps outside this coding environment's
-- reach. Run the statements below there, once, per environment (dev/staging/prod project).
--
-- PREREQUISITE (already done in code, this pass): every Supabase Auth user now gets
-- `app_metadata.tenant_id` set by an admin-only call — see
-- modules/auth/infrastructure/supabase-admin-user.adapter.ts's `setUserTenantMetadata` (called
-- from register-school.service.ts) and modules/users/infrastructure/supabase-invite.adapter.ts's
-- `inviteUserByEmail` (called from invite-user.service.ts). `app_metadata` is admin-only —
-- unlike `user_metadata`, a user cannot forge their own tenant_id via
-- `supabase.auth.updateUser()`, which is why the policies below read `app_metadata`, not
-- `user_metadata`.
--
-- OBJECT KEY CONVENTION every bucket in this codebase uses: `{tenantId}/...` — the first path
-- segment is always the tenant's own id (see modules/branding/application/
-- upload-branding-asset.service.ts's buildBrandingStorageKey, and modules/students/application/
-- document-storage.helpers.ts's buildStorageKey for the equivalent pattern elsewhere). Postgres
-- Storage's `storage.foldername(name)` splits an object key on `/` and returns it as a text[],
-- so `(storage.foldername(name))[1]` is that first tenantId segment.
--
-- Existing users created BEFORE this pass's code shipped won't have `app_metadata.tenant_id` set
-- yet — they'll need one manual `admin.auth.admin.updateUserById(userId, {app_metadata:
-- {tenant_id}})` call each (or a one-off backfill script) before these policies let them upload.

-- ============================================================================
-- school-branding bucket (this bundle's own bucket — the one actually verified below)
-- ============================================================================

create policy "school_branding_tenant_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'school-branding'
  and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
);

create policy "school_branding_tenant_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'school-branding'
  and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
);

create policy "school_branding_tenant_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'school-branding'
  and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
)
with check (
  bucket_id = 'school-branding'
  and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
);

create policy "school_branding_tenant_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'school-branding'
  and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
);

-- ============================================================================
-- The same four-policy shape for every other private, tenant-scoped bucket in this codebase
-- (same `{tenantId}/...` key convention, same fix needed — none of these had working policies
-- either, verified empirically alongside school-branding in this pass). Uncomment once each
-- bucket exists (student-documents already does; employee-documents/platform-invoices do not
-- exist in this dev project yet, per this pass's own live check).
-- ============================================================================

-- create policy "student_documents_tenant_select" on storage.objects for select to authenticated
--   using (bucket_id = 'student-documents' and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));
-- create policy "student_documents_tenant_insert" on storage.objects for insert to authenticated
--   with check (bucket_id = 'student-documents' and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));
-- create policy "student_documents_tenant_update" on storage.objects for update to authenticated
--   using (bucket_id = 'student-documents' and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
--   with check (bucket_id = 'student-documents' and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));
-- create policy "student_documents_tenant_delete" on storage.objects for delete to authenticated
--   using (bucket_id = 'student-documents' and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- create policy "employee_documents_tenant_select" on storage.objects for select to authenticated
--   using (bucket_id = 'employee-documents' and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));
-- create policy "employee_documents_tenant_insert" on storage.objects for insert to authenticated
--   with check (bucket_id = 'employee-documents' and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));
-- create policy "employee_documents_tenant_update" on storage.objects for update to authenticated
--   using (bucket_id = 'employee-documents' and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
--   with check (bucket_id = 'employee-documents' and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));
-- create policy "employee_documents_tenant_delete" on storage.objects for delete to authenticated
--   using (bucket_id = 'employee-documents' and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- ============================================================================
-- Verification (run after applying the policies above, replacing the two placeholder values):
--   1. select id, raw_app_meta_data from auth.users where id = '<a real auth user id>';
--      -> raw_app_meta_data must contain {"tenant_id": "<that user's real tenant id>"}.
--   2. select policyname, cmd from pg_policies where schemaname = 'storage' and tablename = 'objects'
--      and policyname like 'school_branding_%';
--      -> should list all 4 policies created above.
-- ============================================================================

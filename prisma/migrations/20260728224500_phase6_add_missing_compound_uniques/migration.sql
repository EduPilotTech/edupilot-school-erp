-- Adds the (tenant_id, id) compound unique constraint to holidays, working_days, and
-- timetable_entries — missed in the initial Phase 6 migration, caught by typecheck (Prisma
-- client had no `tenantId_id` compound-unique input type for these three models). Safe: these
-- tables were created moments ago in the previous migration and are still empty.

CREATE UNIQUE INDEX "holidays_tenant_id_id_key" ON "holidays"("tenant_id", "id");

CREATE UNIQUE INDEX "working_days_tenant_id_id_key" ON "working_days"("tenant_id", "id");

CREATE UNIQUE INDEX "timetable_entries_tenant_id_id_key" ON "timetable_entries"("tenant_id", "id");

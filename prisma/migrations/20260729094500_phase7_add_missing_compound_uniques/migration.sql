-- Adds the (tenant_id, id) compound unique constraint to marks_entries and exam_results — missed
-- in the initial Phase 7 migration, caught by typecheck (Prisma client had no `tenantId_id`
-- compound-unique input type for these two models, needed by exam-result.repository's
-- updateRanks). Safe: these tables were created moments ago in the previous migration and are
-- still empty.

CREATE UNIQUE INDEX "marks_entries_tenant_id_id_key" ON "marks_entries"("tenant_id", "id");

CREATE UNIQUE INDEX "exam_results_tenant_id_id_key" ON "exam_results"("tenant_id", "id");

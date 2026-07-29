import "server-only";
import { PrismaAcademicSessionRepository } from "../infrastructure/prisma-academic-session.repository";
import type { AcademicSessionEntity } from "../domain/academic-session.entity";

// Read-only — Sprint 4 — Step 4, Step 1: backs the Academic Session dropdown on Student
// Admission. "Active" (not soft-deleted, UPCOMING/ACTIVE status) matches the definition on
// AcademicSessionRepository.findActive.
export async function listActiveAcademicSessions(context: {
  tenantId: string;
}): Promise<AcademicSessionEntity[]> {
  const repository = new PrismaAcademicSessionRepository();
  return repository.findActive(context.tenantId);
}

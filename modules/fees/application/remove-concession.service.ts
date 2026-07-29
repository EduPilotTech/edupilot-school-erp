import "server-only";
import { PrismaFeeConcessionRepository } from "../infrastructure/prisma-fee-concession.repository";
import { FeeConcessionNotFoundError } from "../domain/errors";
import { recordFeeAudit } from "./fee-audit.helpers";

export interface RemoveConcessionContext {
  tenantId: string;
  actingUserId: string;
}

export async function removeConcession(concessionId: string, context: RemoveConcessionContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaFeeConcessionRepository();
  const existing = await repository.findById(tenantId, concessionId);
  if (!existing || existing.deletedAt !== null) {
    throw new FeeConcessionNotFoundError();
  }
  const removed = await repository.softDelete(tenantId, concessionId, actingUserId);

  await recordFeeAudit({
    tenantId,
    actorId: actingUserId,
    action: "CONCESSION_REMOVED",
    entityType: "FeeConcession",
    entityId: concessionId,
    beforeState: existing,
    afterState: removed,
  });
}

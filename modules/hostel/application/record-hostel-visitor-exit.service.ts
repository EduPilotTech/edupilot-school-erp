import "server-only";
import { PrismaHostelVisitorRepository } from "../infrastructure/prisma-hostel-visitor.repository";
import { HostelVisitorNotFoundError, VisitorAlreadyExitedError } from "../domain/errors";
import { toHostelVisitorDTO } from "./log-hostel-visitor.service";
import type { HostelVisitorDTO } from "./dto/hostel-visitor.dto";

export async function recordHostelVisitorExit(
  tenantId: string,
  visitorId: string,
  exitTime: Date
): Promise<HostelVisitorDTO> {
  const repository = new PrismaHostelVisitorRepository();
  const existing = await repository.findById(tenantId, visitorId);
  if (!existing) {
    throw new HostelVisitorNotFoundError();
  }
  if (existing.exitTime !== null) {
    throw new VisitorAlreadyExitedError();
  }

  const visitor = await repository.recordExit(tenantId, visitorId, exitTime);
  return toHostelVisitorDTO(visitor);
}

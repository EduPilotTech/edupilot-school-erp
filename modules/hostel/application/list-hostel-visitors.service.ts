import "server-only";
import { PrismaHostelVisitorRepository } from "../infrastructure/prisma-hostel-visitor.repository";
import { toHostelVisitorDTO } from "./log-hostel-visitor.service";
import type { HostelVisitorDTO } from "./dto/hostel-visitor.dto";

export async function listHostelVisitorsByStudent(tenantId: string, studentId: string): Promise<HostelVisitorDTO[]> {
  const repository = new PrismaHostelVisitorRepository();
  const visitors = await repository.findByStudent(tenantId, studentId);
  return visitors.map(toHostelVisitorDTO);
}

export async function listHostelVisitorsByDateRange(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<HostelVisitorDTO[]> {
  const repository = new PrismaHostelVisitorRepository();
  const visitors = await repository.findByDateRange(tenantId, startDate, endDate);
  return visitors.map(toHostelVisitorDTO);
}

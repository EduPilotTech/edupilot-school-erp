import "server-only";
import { PrismaFeeInvoiceRepository } from "../infrastructure/prisma-fee-invoice.repository";
import { withLiveFine } from "./get-invoice.service";
import type { FeeInvoiceDTO } from "./dto/fee-invoice.dto";
import type { FeeInvoiceStatusValue } from "../domain/fee-invoice.entity";

export interface ListInvoicesFilter {
  academicSessionId?: string;
  classId?: string;
  status?: FeeInvoiceStatusValue;
}

export async function listFeeInvoices(tenantId: string, filter: ListInvoicesFilter): Promise<FeeInvoiceDTO[]> {
  const repository = new PrismaFeeInvoiceRepository();
  const invoices = await repository.findMany(tenantId, filter);
  return Promise.all(invoices.map((invoice) => withLiveFine(tenantId, invoice)));
}

export async function listStudentInvoices(
  tenantId: string,
  studentId: string,
  academicSessionId: string
): Promise<FeeInvoiceDTO[]> {
  const repository = new PrismaFeeInvoiceRepository();
  const invoices = await repository.findByStudent(tenantId, studentId, academicSessionId);
  return Promise.all(invoices.map((invoice) => withLiveFine(tenantId, invoice)));
}

export async function listOutstandingInvoicesForStudent(tenantId: string, studentId: string): Promise<FeeInvoiceDTO[]> {
  const repository = new PrismaFeeInvoiceRepository();
  const invoices = await repository.findOutstandingByStudent(tenantId, studentId);
  return Promise.all(invoices.map((invoice) => withLiveFine(tenantId, invoice)));
}

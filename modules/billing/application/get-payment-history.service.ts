import "server-only";
import { PrismaPaymentRepository } from "../infrastructure/prisma-payment.repository";
import { toPaymentDTO } from "./payment.service";
import type { PaymentDTO } from "./dto/payment.dto";

const paymentRepository = new PrismaPaymentRepository();

export async function getPaymentHistory(tenantId: string): Promise<PaymentDTO[]> {
  const payments = await paymentRepository.findByTenant(tenantId);
  return payments.map(toPaymentDTO);
}

// `refundedAmount > 0` covers both PARTIALLY_REFUNDED and fully REFUNDED payments — the running
// total, not the status enum, is the source of truth here (a payment could in principle be fully
// refunded across several partial refunds; see refundPayment's own comment on accumulation).
export async function getRefundHistory(tenantId: string): Promise<PaymentDTO[]> {
  const payments = await paymentRepository.findByTenant(tenantId);
  return payments.filter((payment) => payment.refundedAmount > 0).map(toPaymentDTO);
}

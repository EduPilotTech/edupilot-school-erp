import "server-only";
import { PrismaFeePaymentRepository } from "../infrastructure/prisma-fee-payment.repository";
import { PrismaFeePaymentAllocationRepository } from "../infrastructure/prisma-fee-payment-allocation.repository";
import { FeePaymentNotFoundError } from "../domain/errors";
import { toFeePaymentDTO } from "./fee-payment.mapper";
import type { FeePaymentDTO } from "./dto/fee-payment.dto";

export async function getFeePayment(tenantId: string, paymentId: string): Promise<FeePaymentDTO> {
  const paymentRepository = new PrismaFeePaymentRepository();
  const payment = await paymentRepository.findById(tenantId, paymentId);
  if (!payment) {
    throw new FeePaymentNotFoundError();
  }
  const allocationRepository = new PrismaFeePaymentAllocationRepository();
  const allocations = await allocationRepository.findByPayment(tenantId, payment.id);
  return toFeePaymentDTO(payment, allocations);
}

export async function listStudentPayments(
  tenantId: string,
  studentId: string,
  academicSessionId: string
): Promise<FeePaymentDTO[]> {
  const paymentRepository = new PrismaFeePaymentRepository();
  const allocationRepository = new PrismaFeePaymentAllocationRepository();
  const payments = await paymentRepository.findByStudent(tenantId, studentId, academicSessionId);
  return Promise.all(
    payments.map(async (payment) => {
      const allocations = await allocationRepository.findByPayment(tenantId, payment.id);
      return toFeePaymentDTO(payment, allocations);
    })
  );
}

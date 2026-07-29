import type { FeePaymentEntity } from "../domain/fee-payment.entity";
import type { FeePaymentAllocationEntity } from "../domain/fee-payment-allocation.entity";
import type { FeePaymentDTO } from "./dto/fee-payment.dto";

export function toFeePaymentDTO(entity: FeePaymentEntity, allocations: FeePaymentAllocationEntity[]): FeePaymentDTO {
  return {
    id: entity.id,
    studentId: entity.studentId,
    academicSessionId: entity.academicSessionId,
    receiptNumber: entity.receiptNumber,
    amount: entity.amount,
    paymentMode: entity.paymentMode,
    status: entity.status,
    paidAt: entity.paidAt.toISOString(),
    collectedBy: entity.collectedBy,
    remarks: entity.remarks,
    reversedAt: entity.reversedAt ? entity.reversedAt.toISOString() : null,
    reversalReason: entity.reversalReason,
    allocations: allocations.map((allocation) => ({
      invoiceId: allocation.invoiceId,
      amountAllocated: allocation.amountAllocated,
    })),
  };
}

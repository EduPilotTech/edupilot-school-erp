import type { FeeInvoiceEntity } from "../domain/fee-invoice.entity";
import type { FeeInvoiceDTO } from "./dto/fee-invoice.dto";

export function toFeeInvoiceDTO(entity: FeeInvoiceEntity): FeeInvoiceDTO {
  const balance =
    Math.round((entity.amount - entity.discountAmount + entity.fineAmount - entity.amountPaid) * 100) / 100;

  return {
    id: entity.id,
    studentId: entity.studentId,
    academicSessionId: entity.academicSessionId,
    classId: entity.classId,
    feeCategoryId: entity.feeCategoryId,
    feeStructureItemId: entity.feeStructureItemId,
    routeFeeRuleId: entity.routeFeeRuleId,
    hostelFeeRuleId: entity.hostelFeeRuleId,
    installmentPlanId: entity.installmentPlanId,
    installmentNumber: entity.installmentNumber,
    appliedConcessionId: entity.appliedConcessionId,
    invoiceNumber: entity.invoiceNumber,
    billingPeriod: entity.billingPeriod,
    amount: entity.amount,
    discountAmount: entity.discountAmount,
    fineAmount: entity.fineAmount,
    amountPaid: entity.amountPaid,
    taxAmount: entity.taxAmount,
    balance,
    dueDate: entity.dueDate.toISOString().slice(0, 10),
    status: entity.status,
    cancelledAt: entity.cancelledAt ? entity.cancelledAt.toISOString() : null,
    cancellationReason: entity.cancellationReason,
  };
}

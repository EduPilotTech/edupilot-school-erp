import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { InvalidAcademicSessionError } from "@/modules/students/domain/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { getCurrentEnrollmentForStudent } from "@/modules/students/application/list-current-enrollments.service";
import { PrismaFeeInvoiceRepository } from "@/modules/fees/infrastructure/prisma-fee-invoice.repository";
import { PrismaFeeNumberSequenceRepository } from "@/modules/fees/infrastructure/prisma-fee-number-sequence.repository";
import { appendLedgerEntry } from "@/modules/fees/application/fee-ledger.helpers";
import { recordFeeAudit } from "@/modules/fees/application/fee-audit.helpers";
import { toFeeInvoiceDTO } from "@/modules/fees/application/fee-invoice.mapper";
import { computeMonthlyDueDate } from "@/modules/fees/application/billing-period.helpers";
import type { FeeInvoiceDTO } from "@/modules/fees/application/dto/fee-invoice.dto";
import { PrismaRouteFeeRuleRepository } from "../infrastructure/prisma-route-fee-rule.repository";
import { PrismaStudentTransportAssignmentRepository } from "../infrastructure/prisma-student-transport-assignment.repository";
import { generateTransportInvoicesSchema } from "./dto/route-fee-rule.dto";

export interface GenerateTransportInvoicesContext {
  tenantId: string;
  actingUserId: string;
}

interface PlannedTransportInvoice {
  studentId: string;
  classId: string;
  feeCategoryId: string;
  routeFeeRuleId: string;
  amount: number;
  dueDate: Date;
}

// The transport analogue of generate-monthly-invoices.service.ts (Phase 10 Decision 1) — reads
// StudentTransportAssignment + RouteFeeRule instead of StudentFeeAssignment + FeeStructureItem,
// but writes through the exact same FeeInvoice/FeeNumberSequence/FeeLedgerEntry/FeeAuditLog
// pipeline, just with routeFeeRuleId set and feeStructureItemId left null. Scoped to MONTHLY
// RouteFeeRules only for V1, mirroring generate-monthly-invoices' own scope (the Fee module has
// separate one-time/installment generators rather than one universal generator; transport
// billing follows that same split — only the monthly path is built this phase).
export async function generateTransportInvoices(
  input: unknown,
  context: GenerateTransportInvoicesContext
): Promise<FeeInvoiceDTO[]> {
  const parsed = generateTransportInvoicesSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid invoice generation request.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  const ruleRepository = new PrismaRouteFeeRuleRepository();
  const assignmentRepository = new PrismaStudentTransportAssignmentRepository();
  const invoiceRepository = new PrismaFeeInvoiceRepository();
  const sequenceRepository = new PrismaFeeNumberSequenceRepository();

  const rules = await ruleRepository.findByAcademicSession(tenantId, data.academicSessionId);
  const monthlyRules = rules.filter((rule) => rule.isActive && rule.frequency === "MONTHLY");
  const planned: PlannedTransportInvoice[] = [];

  for (const rule of monthlyRules) {
    const assignments = await assignmentRepository.findByRoute(tenantId, rule.routeId, data.academicSessionId, {
      status: "ACTIVE",
    });

    for (const assignment of assignments) {
      const enrollment = await getCurrentEnrollmentForStudent(assignment.studentId, data.academicSessionId, {
        tenantId,
      });
      if (!enrollment) continue;

      const existing = await invoiceRepository.findByStudentAndRouteFeeRuleAndPeriod(
        tenantId,
        assignment.studentId,
        rule.id,
        data.billingPeriod
      );
      if (existing) continue;

      planned.push({
        studentId: assignment.studentId,
        classId: enrollment.classId,
        feeCategoryId: rule.feeCategoryId,
        routeFeeRuleId: rule.id,
        amount: rule.amount,
        dueDate: computeMonthlyDueDate(data.billingPeriod, null),
      });
    }
  }

  if (planned.length === 0) return [];

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    const created: FeeInvoiceDTO[] = [];

    for (const plan of planned) {
      try {
        const invoiceNumber = await sequenceRepository.nextNumber(tenantId, data.academicSessionId, "INVOICE", tx);
        const invoice = await invoiceRepository.create(
          {
            tenantId,
            studentId: plan.studentId,
            academicSessionId: data.academicSessionId,
            classId: plan.classId,
            feeCategoryId: plan.feeCategoryId,
            routeFeeRuleId: plan.routeFeeRuleId,
            invoiceNumber,
            billingPeriod: data.billingPeriod,
            amount: plan.amount,
            dueDate: plan.dueDate,
            createdBy: actingUserId,
          },
          tx
        );

        await appendLedgerEntry(
          {
            tenantId,
            studentId: plan.studentId,
            academicSessionId: data.academicSessionId,
            entryType: "INVOICE",
            referenceType: "FeeInvoice",
            referenceId: invoice.id,
            debit: plan.amount,
            description: `Transport invoice ${invoice.invoiceNumber} generated for ${data.billingPeriod}`,
            createdBy: actingUserId,
          },
          tx
        );

        await recordFeeAudit(
          {
            tenantId,
            actorId: actingUserId,
            action: "TRANSPORT_INVOICE_GENERATED",
            entityType: "FeeInvoice",
            entityId: invoice.id,
            afterState: invoice,
          },
          tx
        );

        created.push(toFeeInvoiceDTO(invoice));
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          continue;
        }
        throw error;
      }
    }

    return created;
  });
}

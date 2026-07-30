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
import { PrismaHostelFeeRuleRepository } from "../infrastructure/prisma-hostel-fee-rule.repository";
import { PrismaHostelRoomRepository } from "../infrastructure/prisma-hostel-room.repository";
import { PrismaStudentHostelAssignmentRepository } from "../infrastructure/prisma-student-hostel-assignment.repository";
import { generateHostelMonthlyInvoicesSchema } from "./dto/hostel-fee-rule.dto";

export interface GenerateHostelMonthlyInvoicesContext {
  tenantId: string;
  actingUserId: string;
}

interface PlannedHostelInvoice {
  studentId: string;
  classId: string;
  feeCategoryId: string;
  hostelFeeRuleId: string;
  amount: number;
  dueDate: Date;
}

// The hostel analogue of generateTransportInvoices (Phase 10 Decision 1, extended to Phase 11) —
// reads StudentHostelAssignment + HostelFeeRule instead of StudentTransportAssignment +
// RouteFeeRule, but writes through the exact same FeeInvoice/FeeNumberSequence/FeeLedgerEntry/
// FeeAuditLog pipeline, just with hostelFeeRuleId set and feeStructureItemId/routeFeeRuleId left
// null. Scoped to MONTHLY HostelFeeRules for V1 (Hostel Fee, Mess Fee) — Security Deposit and
// Fine, both ONE_TIME, go through generateHostelOneTimeInvoice instead, mirroring Phase 8's own
// monthly-vs-one-time generator split exactly.
export async function generateHostelMonthlyInvoices(
  input: unknown,
  context: GenerateHostelMonthlyInvoicesContext
): Promise<FeeInvoiceDTO[]> {
  const parsed = generateHostelMonthlyInvoicesSchema.safeParse(input);
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

  const ruleRepository = new PrismaHostelFeeRuleRepository();
  const roomRepository = new PrismaHostelRoomRepository();
  const assignmentRepository = new PrismaStudentHostelAssignmentRepository();
  const invoiceRepository = new PrismaFeeInvoiceRepository();
  const sequenceRepository = new PrismaFeeNumberSequenceRepository();

  const rules = await ruleRepository.findByAcademicSession(tenantId, data.academicSessionId);
  const monthlyRules = rules.filter((rule) => rule.isActive && rule.frequency === "MONTHLY");
  const planned: PlannedHostelInvoice[] = [];

  for (const rule of monthlyRules) {
    const rooms = await roomRepository.findByHostel(tenantId, rule.hostelId);
    const matchingRooms = rooms.filter((room) => room.roomType === rule.roomType);

    for (const room of matchingRooms) {
      const occupants = await assignmentRepository.findCurrentForRoom(tenantId, room.id);

      for (const occupant of occupants) {
        if (occupant.academicSessionId !== data.academicSessionId) continue;

        const enrollment = await getCurrentEnrollmentForStudent(occupant.studentId, data.academicSessionId, {
          tenantId,
        });
        if (!enrollment) continue;

        const existing = await invoiceRepository.findByStudentAndHostelFeeRuleAndPeriod(
          tenantId,
          occupant.studentId,
          rule.id,
          data.billingPeriod
        );
        if (existing) continue;

        planned.push({
          studentId: occupant.studentId,
          classId: enrollment.classId,
          feeCategoryId: rule.feeCategoryId,
          hostelFeeRuleId: rule.id,
          amount: rule.amount,
          dueDate: computeMonthlyDueDate(data.billingPeriod, null),
        });
      }
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
            hostelFeeRuleId: plan.hostelFeeRuleId,
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
            description: `Hostel invoice ${invoice.invoiceNumber} generated for ${data.billingPeriod}`,
            createdBy: actingUserId,
          },
          tx
        );

        await recordFeeAudit(
          {
            tenantId,
            actorId: actingUserId,
            action: "HOSTEL_INVOICE_GENERATED",
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

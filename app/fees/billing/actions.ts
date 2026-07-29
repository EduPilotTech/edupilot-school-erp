"use server";

// Thin Server Actions only — Monthly/One-time/Installment invoice generation and cancellation
// (Phase 8 requirements 5, 9, 12, 23).

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { generateMonthlyInvoices } from "@/modules/fees/application/generate-monthly-invoices.service";
import { generateOneTimeInvoice } from "@/modules/fees/application/generate-one-time-invoice.service";
import { generateInstallmentInvoices } from "@/modules/fees/application/generate-installment-invoices.service";
import { cancelInvoice } from "@/modules/fees/application/cancel-invoice.service";
import { translateFeeError, type ActionResult } from "../_lib/translate-fee-error";
import type { FeeInvoiceDTO } from "@/modules/fees/application/dto/fee-invoice.dto";

export async function generateMonthlyInvoicesAction(input: unknown): Promise<ActionResult<FeeInvoiceDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("fee.generate");
  try {
    const invoices = await generateMonthlyInvoices(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: invoices };
  } catch (error) {
    return translateFeeError(error);
  }
}

export async function generateOneTimeInvoiceAction(input: unknown): Promise<ActionResult<FeeInvoiceDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("fee.generate");
  try {
    const invoice = await generateOneTimeInvoice(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: invoice };
  } catch (error) {
    return translateFeeError(error);
  }
}

export async function generateInstallmentInvoicesAction(input: unknown): Promise<ActionResult<FeeInvoiceDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("fee.generate");
  try {
    const invoices = await generateInstallmentInvoices(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: invoices };
  } catch (error) {
    return translateFeeError(error);
  }
}

export async function cancelInvoiceAction(input: unknown): Promise<ActionResult<FeeInvoiceDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("fee.invoice.cancel");
  try {
    const invoice = await cancelInvoice(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: invoice };
  } catch (error) {
    return translateFeeError(error);
  }
}

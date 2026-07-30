"use server";

// Thin Server Actions only — no business logic here, matching every other actions.ts in this
// codebase. Covers all of Phase 11: Hostel/Building/Wing/Floor/Room/Bed master data, Student
// Hostel Assignment (check-in/transfer/check-out), Hostel Attendance, Leave Management, Visitor
// Register, Mess Management, and Hostel Fee Rules + billing.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { createHostel } from "@/modules/hostel/application/create-hostel.service";
import { updateHostel, deleteHostel } from "@/modules/hostel/application/update-hostel.service";
import { createHostelBuilding } from "@/modules/hostel/application/create-hostel-building.service";
import { updateHostelBuilding, deleteHostelBuilding } from "@/modules/hostel/application/update-hostel-building.service";
import { createHostelFloor } from "@/modules/hostel/application/create-hostel-floor.service";
import { updateHostelFloor, deleteHostelFloor } from "@/modules/hostel/application/update-hostel-floor.service";
import { createHostelWing } from "@/modules/hostel/application/create-hostel-wing.service";
import { updateHostelWing, deleteHostelWing } from "@/modules/hostel/application/update-hostel-wing.service";
import { createHostelRoom } from "@/modules/hostel/application/create-hostel-room.service";
import { updateHostelRoom, deleteHostelRoom } from "@/modules/hostel/application/update-hostel-room.service";
import { createHostelBed } from "@/modules/hostel/application/create-hostel-bed.service";
import {
  updateHostelBed,
  setHostelBedMaintenance,
  deleteHostelBed,
} from "@/modules/hostel/application/update-hostel-bed.service";
import { checkInStudentHostel } from "@/modules/hostel/application/check-in-student-hostel.service";
import { transferStudentHostel } from "@/modules/hostel/application/transfer-student-hostel.service";
import { checkOutStudentHostel } from "@/modules/hostel/application/check-out-student-hostel.service";
import { bulkMarkHostelAttendance } from "@/modules/hostel/application/bulk-mark-hostel-attendance.service";
import { requestHostelLeave } from "@/modules/hostel/application/request-hostel-leave.service";
import {
  approveHostelLeave,
  rejectHostelLeave,
  cancelHostelLeave,
} from "@/modules/hostel/application/decide-hostel-leave.service";
import { recordHostelLeaveReturn } from "@/modules/hostel/application/record-hostel-leave-return.service";
import { logHostelVisitor } from "@/modules/hostel/application/log-hostel-visitor.service";
import { recordHostelVisitorExit } from "@/modules/hostel/application/record-hostel-visitor-exit.service";
import { createMessMealPlan } from "@/modules/hostel/application/create-mess-meal-plan.service";
import { updateMessMealPlan, deleteMessMealPlan } from "@/modules/hostel/application/update-mess-meal-plan.service";
import { createMessMeal } from "@/modules/hostel/application/create-mess-meal.service";
import { updateMessMeal, deleteMessMeal } from "@/modules/hostel/application/update-mess-meal.service";
import { createHostelFeeRule } from "@/modules/hostel/application/create-hostel-fee-rule.service";
import { updateHostelFeeRule, deleteHostelFeeRule } from "@/modules/hostel/application/update-hostel-fee-rule.service";
import { generateHostelMonthlyInvoices } from "@/modules/hostel/application/generate-hostel-monthly-invoices.service";
import { generateHostelOneTimeInvoice } from "@/modules/hostel/application/generate-hostel-one-time-invoice.service";
import { translateHostelError, type ActionResult } from "./_lib/translate-hostel-error";
import type { HostelDTO } from "@/modules/hostel/application/dto/hostel.dto";
import type {
  HostelBuildingDTO,
  HostelFloorDTO,
  HostelWingDTO,
  HostelRoomDTO,
  HostelBedDTO,
} from "@/modules/hostel/application/dto/hostel-structure.dto";
import type { StudentHostelAssignmentDTO } from "@/modules/hostel/application/dto/student-hostel-assignment.dto";
import type { HostelAttendanceDTO } from "@/modules/hostel/application/dto/hostel-attendance.dto";
import type { HostelLeaveRequestDTO } from "@/modules/hostel/application/dto/hostel-leave-request.dto";
import type { HostelVisitorDTO } from "@/modules/hostel/application/dto/hostel-visitor.dto";
import type { MessMealPlanDTO, MessMealDTO } from "@/modules/hostel/application/dto/mess.dto";
import type { HostelFeeRuleDTO } from "@/modules/hostel/application/dto/hostel-fee-rule.dto";
import type { FeeInvoiceDTO } from "@/modules/fees/application/dto/fee-invoice.dto";

// --- Hostel ------------------------------------------------------------------------------------

export async function createHostelAction(input: unknown): Promise<ActionResult<HostelDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.manage");
  try {
    const hostel = await createHostel(input, {
      tenantId: authContext.tenantId,
      schoolId: authContext.schoolId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: hostel };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function updateHostelAction(hostelId: string, input: unknown): Promise<ActionResult<HostelDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.manage");
  try {
    const hostel = await updateHostel(hostelId, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: hostel };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function deleteHostelAction(hostelId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.manage");
  try {
    await deleteHostel(hostelId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateHostelError(error);
  }
}

// --- Building / Floor / Wing --------------------------------------------------------------

export async function createHostelBuildingAction(input: unknown): Promise<ActionResult<HostelBuildingDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.manage");
  try {
    const building = await createHostelBuilding(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: building };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function updateHostelBuildingAction(
  buildingId: string,
  input: unknown
): Promise<ActionResult<HostelBuildingDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.manage");
  try {
    const building = await updateHostelBuilding(buildingId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: building };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function deleteHostelBuildingAction(buildingId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.manage");
  try {
    await deleteHostelBuilding(buildingId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function createHostelFloorAction(input: unknown): Promise<ActionResult<HostelFloorDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.manage");
  try {
    const floor = await createHostelFloor(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: floor };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function updateHostelFloorAction(floorId: string, input: unknown): Promise<ActionResult<HostelFloorDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.manage");
  try {
    const floor = await updateHostelFloor(floorId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: floor };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function deleteHostelFloorAction(floorId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.manage");
  try {
    await deleteHostelFloor(floorId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function createHostelWingAction(input: unknown): Promise<ActionResult<HostelWingDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.manage");
  try {
    const wing = await createHostelWing(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: wing };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function updateHostelWingAction(wingId: string, input: unknown): Promise<ActionResult<HostelWingDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.manage");
  try {
    const wing = await updateHostelWing(wingId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: wing };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function deleteHostelWingAction(wingId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.manage");
  try {
    await deleteHostelWing(wingId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateHostelError(error);
  }
}

// --- Room / Bed ----------------------------------------------------------------------------

export async function createHostelRoomAction(input: unknown): Promise<ActionResult<HostelRoomDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.room.manage");
  try {
    const room = await createHostelRoom(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: room };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function updateHostelRoomAction(roomId: string, input: unknown): Promise<ActionResult<HostelRoomDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.room.manage");
  try {
    const room = await updateHostelRoom(roomId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: room };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function deleteHostelRoomAction(roomId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.room.manage");
  try {
    await deleteHostelRoom(roomId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function createHostelBedAction(input: unknown): Promise<ActionResult<HostelBedDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.bed.manage");
  try {
    const bed = await createHostelBed(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: bed };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function updateHostelBedAction(bedId: string, input: unknown): Promise<ActionResult<HostelBedDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.bed.manage");
  try {
    const bed = await updateHostelBed(bedId, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: bed };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function setHostelBedMaintenanceAction(
  bedId: string,
  underMaintenance: boolean
): Promise<ActionResult<HostelBedDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.bed.manage");
  try {
    const bed = await setHostelBedMaintenance(bedId, underMaintenance, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: bed };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function deleteHostelBedAction(bedId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.bed.manage");
  try {
    await deleteHostelBed(bedId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateHostelError(error);
  }
}

// --- Student Hostel Assignment ---------------------------------------------------------------

export async function checkInStudentHostelAction(input: unknown): Promise<ActionResult<StudentHostelAssignmentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.assignment.manage");
  try {
    const assignment = await checkInStudentHostel(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: assignment };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function transferStudentHostelAction(input: unknown): Promise<ActionResult<StudentHostelAssignmentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.assignment.manage");
  try {
    const assignment = await transferStudentHostel(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: assignment };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function checkOutStudentHostelAction(input: unknown): Promise<ActionResult<StudentHostelAssignmentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.assignment.manage");
  try {
    const assignment = await checkOutStudentHostel(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: assignment };
  } catch (error) {
    return translateHostelError(error);
  }
}

// --- Hostel Attendance ---------------------------------------------------------------------

export async function bulkMarkHostelAttendanceAction(input: unknown): Promise<ActionResult<HostelAttendanceDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.attendance.mark");
  try {
    const results = await bulkMarkHostelAttendance(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: results };
  } catch (error) {
    return translateHostelError(error);
  }
}

// --- Leave Management ----------------------------------------------------------------------

export async function requestHostelLeaveAction(input: unknown): Promise<ActionResult<HostelLeaveRequestDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.leave.manage");
  try {
    const leave = await requestHostelLeave(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: leave };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function approveHostelLeaveAction(leaveId: string): Promise<ActionResult<HostelLeaveRequestDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.leave.manage");
  try {
    const leave = await approveHostelLeave(leaveId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: leave };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function rejectHostelLeaveAction(leaveId: string, input: unknown): Promise<ActionResult<HostelLeaveRequestDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.leave.manage");
  try {
    const leave = await rejectHostelLeave(leaveId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: leave };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function cancelHostelLeaveAction(leaveId: string): Promise<ActionResult<HostelLeaveRequestDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.leave.manage");
  try {
    const leave = await cancelHostelLeave(leaveId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: leave };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function recordHostelLeaveReturnAction(
  leaveId: string,
  input: unknown
): Promise<ActionResult<HostelLeaveRequestDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.leave.manage");
  try {
    const leave = await recordHostelLeaveReturn(leaveId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: leave };
  } catch (error) {
    return translateHostelError(error);
  }
}

// --- Visitor Register -----------------------------------------------------------------------

export async function logHostelVisitorAction(input: unknown): Promise<ActionResult<HostelVisitorDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.visitor.manage");
  try {
    const visitor = await logHostelVisitor(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: visitor };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function recordHostelVisitorExitAction(visitorId: string): Promise<ActionResult<HostelVisitorDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.visitor.manage");
  try {
    const visitor = await recordHostelVisitorExit(authContext.tenantId, visitorId, new Date());
    return { success: true, data: visitor };
  } catch (error) {
    return translateHostelError(error);
  }
}

// --- Mess Management -------------------------------------------------------------------------

export async function createMessMealPlanAction(input: unknown): Promise<ActionResult<MessMealPlanDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.mess.manage");
  try {
    const plan = await createMessMealPlan(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: plan };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function updateMessMealPlanAction(planId: string, input: unknown): Promise<ActionResult<MessMealPlanDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.mess.manage");
  try {
    const plan = await updateMessMealPlan(planId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: plan };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function deleteMessMealPlanAction(planId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.mess.manage");
  try {
    await deleteMessMealPlan(planId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function createMessMealAction(input: unknown): Promise<ActionResult<MessMealDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.mess.manage");
  try {
    const meal = await createMessMeal(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: meal };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function updateMessMealAction(mealId: string, input: unknown): Promise<ActionResult<MessMealDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.mess.manage");
  try {
    const meal = await updateMessMeal(mealId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: meal };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function deleteMessMealAction(mealId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.mess.manage");
  try {
    await deleteMessMeal(mealId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateHostelError(error);
  }
}

// --- Hostel Fee Rules + Billing --------------------------------------------------------------

export async function createHostelFeeRuleAction(input: unknown): Promise<ActionResult<HostelFeeRuleDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.fee-rule.manage");
  try {
    const rule = await createHostelFeeRule(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: rule };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function updateHostelFeeRuleAction(ruleId: string, input: unknown): Promise<ActionResult<HostelFeeRuleDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.fee-rule.manage");
  try {
    const rule = await updateHostelFeeRule(ruleId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: rule };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function deleteHostelFeeRuleAction(ruleId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.fee-rule.manage");
  try {
    await deleteHostelFeeRule(ruleId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function generateHostelMonthlyInvoicesAction(input: unknown): Promise<ActionResult<FeeInvoiceDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.fee-rule.manage");
  try {
    const invoices = await generateHostelMonthlyInvoices(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: invoices };
  } catch (error) {
    return translateHostelError(error);
  }
}

export async function generateHostelOneTimeInvoiceAction(input: unknown): Promise<ActionResult<FeeInvoiceDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.fee-rule.manage");
  try {
    const invoice = await generateHostelOneTimeInvoice(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: invoice };
  } catch (error) {
    return translateHostelError(error);
  }
}

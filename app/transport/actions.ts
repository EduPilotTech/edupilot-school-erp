"use server";

// Thin Server Actions only — no business logic here, matching every other actions.ts in this
// codebase. Covers all of Phase 10: Vehicle/Driver/Helper/Route/Stop master data, Vehicle
// Assignment, Student Transport Assignment, Route Fee Rules + billing, and Daily Transport
// Attendance.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { createVehicle } from "@/modules/transport/application/create-vehicle.service";
import { updateVehicle, deleteVehicle } from "@/modules/transport/application/update-vehicle.service";
import { createDriver } from "@/modules/transport/application/create-driver.service";
import { updateDriver, deleteDriver } from "@/modules/transport/application/update-driver.service";
import { createHelper } from "@/modules/transport/application/create-helper.service";
import { updateHelper, deleteHelper } from "@/modules/transport/application/update-helper.service";
import { createRoute } from "@/modules/transport/application/create-route.service";
import { updateRoute, deleteRoute } from "@/modules/transport/application/update-route.service";
import { createRouteStop } from "@/modules/transport/application/create-route-stop.service";
import { updateRouteStop, deleteRouteStop } from "@/modules/transport/application/update-route-stop.service";
import { assignVehicleToRoute } from "@/modules/transport/application/assign-vehicle-to-route.service";
import { assignStudentTransport } from "@/modules/transport/application/assign-student-transport.service";
import { updateStudentTransportStatus } from "@/modules/transport/application/update-student-transport-status.service";
import { createRouteFeeRule } from "@/modules/transport/application/create-route-fee-rule.service";
import { updateRouteFeeRule, deleteRouteFeeRule } from "@/modules/transport/application/update-route-fee-rule.service";
import { generateTransportInvoices } from "@/modules/transport/application/generate-transport-invoices.service";
import { bulkMarkTransportAttendance } from "@/modules/transport/application/bulk-mark-transport-attendance.service";
import { translateTransportError, type ActionResult } from "./_lib/translate-transport-error";
import type { VehicleDTO } from "@/modules/transport/application/dto/vehicle.dto";
import type { DriverDTO } from "@/modules/transport/application/dto/driver.dto";
import type { HelperDTO } from "@/modules/transport/application/dto/helper.dto";
import type { RouteDTO, RouteStopDTO } from "@/modules/transport/application/dto/route.dto";
import type { VehicleAssignmentDTO } from "@/modules/transport/application/dto/vehicle-assignment.dto";
import type { StudentTransportAssignmentDTO } from "@/modules/transport/application/dto/student-transport-assignment.dto";
import type { RouteFeeRuleDTO } from "@/modules/transport/application/dto/route-fee-rule.dto";
import type { TransportAttendanceDTO } from "@/modules/transport/application/dto/transport-attendance.dto";
import type { FeeInvoiceDTO } from "@/modules/fees/application/dto/fee-invoice.dto";

// --- Vehicle ---------------------------------------------------------------------------------

export async function createVehicleAction(input: unknown): Promise<ActionResult<VehicleDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.vehicle.manage");
  try {
    const vehicle = await createVehicle(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: vehicle };
  } catch (error) {
    return translateTransportError(error);
  }
}

export async function updateVehicleAction(vehicleId: string, input: unknown): Promise<ActionResult<VehicleDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.vehicle.manage");
  try {
    const vehicle = await updateVehicle(vehicleId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: vehicle };
  } catch (error) {
    return translateTransportError(error);
  }
}

export async function deleteVehicleAction(vehicleId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.vehicle.manage");
  try {
    await deleteVehicle(vehicleId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateTransportError(error);
  }
}

// --- Driver ------------------------------------------------------------------------------------

export async function createDriverAction(input: unknown): Promise<ActionResult<DriverDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.driver.manage");
  try {
    const driver = await createDriver(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: driver };
  } catch (error) {
    return translateTransportError(error);
  }
}

export async function updateDriverAction(driverId: string, input: unknown): Promise<ActionResult<DriverDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.driver.manage");
  try {
    const driver = await updateDriver(driverId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: driver };
  } catch (error) {
    return translateTransportError(error);
  }
}

export async function deleteDriverAction(driverId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.driver.manage");
  try {
    await deleteDriver(driverId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateTransportError(error);
  }
}

// --- Helper ------------------------------------------------------------------------------------

export async function createHelperAction(input: unknown): Promise<ActionResult<HelperDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.helper.manage");
  try {
    const helper = await createHelper(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: helper };
  } catch (error) {
    return translateTransportError(error);
  }
}

export async function updateHelperAction(helperId: string, input: unknown): Promise<ActionResult<HelperDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.helper.manage");
  try {
    const helper = await updateHelper(helperId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: helper };
  } catch (error) {
    return translateTransportError(error);
  }
}

export async function deleteHelperAction(helperId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.helper.manage");
  try {
    await deleteHelper(helperId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateTransportError(error);
  }
}

// --- Route + Stop --------------------------------------------------------------------------

export async function createRouteAction(input: unknown): Promise<ActionResult<RouteDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.route.manage");
  try {
    const route = await createRoute(input, {
      tenantId: authContext.tenantId,
      schoolId: authContext.schoolId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: route };
  } catch (error) {
    return translateTransportError(error);
  }
}

export async function updateRouteAction(routeId: string, input: unknown): Promise<ActionResult<RouteDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.route.manage");
  try {
    const route = await updateRoute(routeId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: route };
  } catch (error) {
    return translateTransportError(error);
  }
}

export async function deleteRouteAction(routeId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.route.manage");
  try {
    await deleteRoute(routeId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateTransportError(error);
  }
}

export async function createRouteStopAction(input: unknown): Promise<ActionResult<RouteStopDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.stop.manage");
  try {
    const stop = await createRouteStop(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: stop };
  } catch (error) {
    return translateTransportError(error);
  }
}

export async function updateRouteStopAction(stopId: string, input: unknown): Promise<ActionResult<RouteStopDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.stop.manage");
  try {
    const stop = await updateRouteStop(stopId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: stop };
  } catch (error) {
    return translateTransportError(error);
  }
}

export async function deleteRouteStopAction(stopId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.stop.manage");
  try {
    await deleteRouteStop(stopId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateTransportError(error);
  }
}

// --- Assignments ---------------------------------------------------------------------------

export async function assignVehicleToRouteAction(input: unknown): Promise<ActionResult<VehicleAssignmentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.assignment.manage");
  try {
    const assignment = await assignVehicleToRoute(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: assignment };
  } catch (error) {
    return translateTransportError(error);
  }
}

export async function assignStudentTransportAction(
  input: unknown
): Promise<ActionResult<StudentTransportAssignmentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.student-assignment.manage");
  try {
    const assignment = await assignStudentTransport(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: assignment };
  } catch (error) {
    return translateTransportError(error);
  }
}

export async function updateStudentTransportStatusAction(
  studentId: string,
  academicSessionId: string,
  input: unknown
): Promise<ActionResult<StudentTransportAssignmentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.student-assignment.manage");
  try {
    const assignment = await updateStudentTransportStatus(studentId, academicSessionId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: assignment };
  } catch (error) {
    return translateTransportError(error);
  }
}

// --- Route Fee Rules + Billing -------------------------------------------------------------

export async function createRouteFeeRuleAction(input: unknown): Promise<ActionResult<RouteFeeRuleDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.fee-rule.manage");
  try {
    const rule = await createRouteFeeRule(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: rule };
  } catch (error) {
    return translateTransportError(error);
  }
}

export async function updateRouteFeeRuleAction(ruleId: string, input: unknown): Promise<ActionResult<RouteFeeRuleDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.fee-rule.manage");
  try {
    const rule = await updateRouteFeeRule(ruleId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: rule };
  } catch (error) {
    return translateTransportError(error);
  }
}

export async function deleteRouteFeeRuleAction(ruleId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.fee-rule.manage");
  try {
    await deleteRouteFeeRule(ruleId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateTransportError(error);
  }
}

export async function generateTransportInvoicesAction(input: unknown): Promise<ActionResult<FeeInvoiceDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.fee-rule.manage");
  try {
    const invoices = await generateTransportInvoices(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: invoices };
  } catch (error) {
    return translateTransportError(error);
  }
}

// --- Daily Transport Attendance -------------------------------------------------------------

export async function bulkMarkTransportAttendanceAction(
  input: unknown
): Promise<ActionResult<TransportAttendanceDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("transport.attendance.mark");
  try {
    const results = await bulkMarkTransportAttendance(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: results };
  } catch (error) {
    return translateTransportError(error);
  }
}

"use server";

// Thin Server Actions only — no business logic here, matching app/attendance/actions.ts exactly.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { InvalidAcademicSessionError } from "@/modules/students/domain/errors";
import { setWorkingDays } from "@/modules/timetable/application/set-working-days.service";
import { setPeriodConfiguration } from "@/modules/timetable/application/set-period-configuration.service";
import { addHoliday } from "@/modules/timetable/application/add-holiday.service";
import { removeHoliday } from "@/modules/timetable/application/remove-holiday.service";
import {
  HolidayAlreadyExistsError,
  HolidayNotFoundError,
  HolidayOutsideSessionError,
  InvalidPeriodConfigurationError,
  NoWorkingDaysError,
} from "@/modules/timetable/domain/errors";
import type {
  HolidayDTO,
  PeriodConfigurationDTO,
  WorkingDayDTO,
} from "@/modules/timetable/application/dto/school-config.dto";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function translateSchoolConfigError(error: unknown): ActionResult<never> {
  if (error instanceof HolidayNotFoundError) {
    return { success: false, error: { code: "HOLIDAY_NOT_FOUND", message: error.message } };
  }
  if (error instanceof HolidayAlreadyExistsError) {
    return { success: false, error: { code: "HOLIDAY_ALREADY_EXISTS", message: error.message } };
  }
  if (error instanceof HolidayOutsideSessionError) {
    return { success: false, error: { code: "HOLIDAY_OUTSIDE_SESSION", message: error.message } };
  }
  if (error instanceof InvalidAcademicSessionError) {
    return { success: false, error: { code: "INVALID_ACADEMIC_SESSION", message: error.message } };
  }
  if (error instanceof InvalidPeriodConfigurationError) {
    return { success: false, error: { code: "INVALID_PERIOD_CONFIGURATION", message: error.message } };
  }
  if (error instanceof NoWorkingDaysError) {
    return { success: false, error: { code: "NO_WORKING_DAYS", message: error.message } };
  }
  if (error instanceof NotFoundError) {
    return { success: false, error: { code: "NOT_FOUND", message: error.message } };
  }
  if (error instanceof BusinessRuleError) {
    return { success: false, error: { code: "BUSINESS_RULE_VIOLATION", message: error.message } };
  }
  if (error instanceof ValidationError) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: error.message } };
  }
  throw error;
}

export async function setWorkingDaysAction(input: unknown): Promise<ActionResult<WorkingDayDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("school.config.manage");

  try {
    const days = await setWorkingDays(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: days };
  } catch (error) {
    return translateSchoolConfigError(error);
  }
}

export async function setPeriodConfigurationAction(
  input: unknown
): Promise<ActionResult<PeriodConfigurationDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("school.config.manage");

  try {
    const periods = await setPeriodConfiguration(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: periods };
  } catch (error) {
    return translateSchoolConfigError(error);
  }
}

export async function addHolidayAction(input: unknown): Promise<ActionResult<HolidayDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("school.config.manage");

  try {
    const holiday = await addHoliday(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: holiday };
  } catch (error) {
    return translateSchoolConfigError(error);
  }
}

export async function removeHolidayAction(holidayId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("school.config.manage");

  try {
    await removeHoliday(holidayId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateSchoolConfigError(error);
  }
}

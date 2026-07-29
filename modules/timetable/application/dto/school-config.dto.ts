import { z } from "zod";

const dayOfWeekSchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

export const setWorkingDaysSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  days: z
    .array(z.object({ dayOfWeek: dayOfWeekSchema, isWorking: z.boolean() }))
    .length(7, "All 7 days of the week must be provided."),
});
export type SetWorkingDaysServiceInput = z.infer<typeof setWorkingDaysSchema>;

// Time-of-day fields accept "HH:mm" and are coerced against a fixed reference date — only the
// time-of-day component is meaningful (matches `@db.Time`'s own storage semantics).
const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use 24-hour HH:mm format.")
  .transform((value) => new Date(`1970-01-01T${value}:00.000Z`));

export const setPeriodConfigurationSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  periods: z
    .array(
      z.object({
        periodNumber: z.number().int().positive(),
        startTime: timeOfDaySchema,
        endTime: timeOfDaySchema,
        isBreak: z.boolean().default(false),
      })
    )
    .min(1, "At least one period is required."),
});
export type SetPeriodConfigurationServiceInput = z.infer<typeof setPeriodConfigurationSchema>;

export const addHolidaySchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  date: z.coerce.date(),
  name: z.string().trim().min(1, "Holiday name is required.").max(200),
});
export type AddHolidayServiceInput = z.infer<typeof addHolidaySchema>;

export interface WorkingDayDTO {
  dayOfWeek: string;
  isWorking: boolean;
}

export interface PeriodConfigurationDTO {
  id: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

export interface HolidayDTO {
  id: string;
  date: Date;
  name: string;
}

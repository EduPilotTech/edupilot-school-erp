import type { HolidayEntity } from "./holiday.entity";

export interface CreateHolidayInput {
  tenantId: string;
  academicSessionId: string;
  date: Date;
  name: string;
  createdBy?: string | null;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6 — no ambient tenant
// context, never trusted from a caller's request. No `update` — a holiday is added or removed,
// never edited in place (matches StudentDocument's own create/delete-only shape).
export interface HolidayRepository {
  findById(tenantId: string, id: string): Promise<HolidayEntity | null>;
  findByAcademicSession(tenantId: string, academicSessionId: string): Promise<HolidayEntity[]>;
  findByDate(tenantId: string, academicSessionId: string, date: Date): Promise<HolidayEntity | null>;
  create(input: CreateHolidayInput): Promise<HolidayEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HolidayEntity>;
}

import type { TeacherEntity } from "./teacher.entity";

export interface CreateTeacherInput {
  tenantId: string;
  userProfileId: string;
  employeeCode: string;
  joiningDate: Date;
  qualification?: string | null;
  createdBy?: string | null;
}

export interface UpdateTeacherInput {
  employeeCode?: string;
  joiningDate?: Date;
  qualification?: string | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface TeacherListFilter {
  page: number;
  pageSize: number;
}

export interface TeacherListResult {
  items: TeacherEntity[];
  total: number;
  page: number;
  pageSize: number;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6 — no ambient tenant
// context, never trusted from a caller's request.
export interface TeacherRepository {
  findById(tenantId: string, id: string): Promise<TeacherEntity | null>;
  findByUserProfileId(tenantId: string, userProfileId: string): Promise<TeacherEntity | null>;
  findByEmployeeCode(tenantId: string, employeeCode: string): Promise<TeacherEntity | null>;
  findMany(tenantId: string, filter: TeacherListFilter): Promise<TeacherListResult>;
  create(input: CreateTeacherInput): Promise<TeacherEntity>;
  update(tenantId: string, id: string, input: UpdateTeacherInput): Promise<TeacherEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<TeacherEntity>;
  restore(tenantId: string, id: string, updatedBy: string | null): Promise<TeacherEntity>;
}

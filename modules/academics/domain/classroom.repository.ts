import type { ClassroomEntity } from "./classroom.entity";

export interface CreateClassroomInput {
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  capacity?: number | null;
  createdBy?: string | null;
}

export interface UpdateClassroomInput {
  name?: string;
  code?: string;
  capacity?: number | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface ClassroomListFilter {
  page: number;
  pageSize: number;
}

export interface ClassroomListResult {
  items: ClassroomEntity[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClassroomRepository {
  findById(tenantId: string, id: string): Promise<ClassroomEntity | null>;
  findByCode(tenantId: string, code: string): Promise<ClassroomEntity | null>;
  findMany(tenantId: string, filter: ClassroomListFilter): Promise<ClassroomListResult>;
  create(input: CreateClassroomInput): Promise<ClassroomEntity>;
  update(tenantId: string, id: string, input: UpdateClassroomInput): Promise<ClassroomEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<ClassroomEntity>;
  restore(tenantId: string, id: string, updatedBy: string | null): Promise<ClassroomEntity>;
}

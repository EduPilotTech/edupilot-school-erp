import type { SectionEntity } from "./section.entity";

export interface CreateSectionInput {
  tenantId: string;
  classId: string;
  name: string;
  capacity?: number | null;
  createdBy?: string | null;
}

export interface UpdateSectionInput {
  name?: string;
  capacity?: number | null;
  updatedBy?: string | null;
}

export interface SectionListFilter {
  classId?: string;
  page: number;
  pageSize: number;
}

export interface SectionListResult {
  items: SectionEntity[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SectionRepository {
  findById(tenantId: string, id: string): Promise<SectionEntity | null>;
  findMany(tenantId: string, filter: SectionListFilter): Promise<SectionListResult>;
  create(input: CreateSectionInput): Promise<SectionEntity>;
  update(tenantId: string, id: string, input: UpdateSectionInput): Promise<SectionEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<SectionEntity>;
  restore(tenantId: string, id: string, updatedBy: string | null): Promise<SectionEntity>;
}

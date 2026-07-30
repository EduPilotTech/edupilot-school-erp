import type { HostelVisitorEntity } from "./hostel-visitor.entity";

export interface CreateHostelVisitorInput {
  tenantId: string;
  studentId: string;
  visitorName: string;
  relation: string;
  purpose: string;
  entryTime: Date;
  approvedBy?: string | null;
  createdBy?: string | null;
}

export interface HostelVisitorRepository {
  findById(tenantId: string, id: string): Promise<HostelVisitorEntity | null>;
  findByStudent(tenantId: string, studentId: string): Promise<HostelVisitorEntity[]>;
  findByDateRange(tenantId: string, startDate: Date, endDate: Date): Promise<HostelVisitorEntity[]>;
  create(input: CreateHostelVisitorInput): Promise<HostelVisitorEntity>;
  recordExit(tenantId: string, id: string, exitTime: Date): Promise<HostelVisitorEntity>;
}

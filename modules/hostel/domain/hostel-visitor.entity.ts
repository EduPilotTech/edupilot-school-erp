export interface HostelVisitorEntity {
  id: string;
  tenantId: string;
  studentId: string;
  visitorName: string;
  relation: string;
  purpose: string;
  entryTime: Date;
  exitTime: Date | null;
  approvedBy: string | null;
  createdAt: Date;
  createdBy: string | null;
}

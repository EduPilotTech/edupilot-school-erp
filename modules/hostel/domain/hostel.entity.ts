export type HostelTypeValue = "BOYS" | "GIRLS" | "CO_ED";

// School-scoped, session-independent master data — the hostel's top-level property record.
export interface HostelEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  type: HostelTypeValue;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

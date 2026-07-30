// Physical storage location, level 1 — a Library has many Racks.
export interface RackEntity {
  id: string;
  tenantId: string;
  libraryId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

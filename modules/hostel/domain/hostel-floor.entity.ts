export interface HostelFloorEntity {
  id: string;
  tenantId: string;
  buildingId: string;
  name: string;
  floorNumber: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

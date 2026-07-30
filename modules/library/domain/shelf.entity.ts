// Physical storage location, level 2 — a Rack has many Shelves; a BookCopy is ultimately placed
// on a Shelf.
export interface ShelfEntity {
  id: string;
  tenantId: string;
  rackId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

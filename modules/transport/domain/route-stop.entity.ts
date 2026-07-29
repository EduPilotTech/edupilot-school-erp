// One boarding point along a Route, ordered by sequenceOrder. latitude/longitude are reserved
// for future map-based plotting (Decision 11) — always null this phase.
export interface RouteStopEntity {
  id: string;
  tenantId: string;
  routeId: string;
  name: string;
  sequenceOrder: number;
  pickupTime: string | null; // "HH:mm" — converted from Prisma's @db.Time at the mapper boundary
  dropTime: string | null;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

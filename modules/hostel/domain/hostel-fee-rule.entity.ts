import type { FeeFrequencyValue } from "@/modules/fees/domain/fee-structure.entity";
import type { RoomTypeValue } from "./hostel-room.entity";

// The hostel analogue of RouteFeeRule — amount keyed by (Hostel, RoomType) instead of Route.
export interface HostelFeeRuleEntity {
  id: string;
  tenantId: string;
  hostelId: string;
  roomType: RoomTypeValue;
  academicSessionId: string;
  feeCategoryId: string;
  amount: number;
  frequency: FeeFrequencyValue;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

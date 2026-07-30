import type { FeeFrequencyValue } from "@/modules/fees/domain/fee-structure.entity";
import type { HostelFeeRuleEntity } from "./hostel-fee-rule.entity";
import type { RoomTypeValue } from "./hostel-room.entity";

export interface CreateHostelFeeRuleInput {
  tenantId: string;
  hostelId: string;
  roomType: RoomTypeValue;
  academicSessionId: string;
  feeCategoryId: string;
  amount: number;
  frequency: FeeFrequencyValue;
  createdBy?: string | null;
}

export interface UpdateHostelFeeRuleInput {
  amount?: number;
  frequency?: FeeFrequencyValue;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface HostelFeeRuleRepository {
  findById(tenantId: string, id: string): Promise<HostelFeeRuleEntity | null>;
  findByHostel(tenantId: string, hostelId: string, academicSessionId: string): Promise<HostelFeeRuleEntity[]>;
  findByAcademicSession(tenantId: string, academicSessionId: string): Promise<HostelFeeRuleEntity[]>;
  create(input: CreateHostelFeeRuleInput): Promise<HostelFeeRuleEntity>;
  update(tenantId: string, id: string, input: UpdateHostelFeeRuleInput): Promise<HostelFeeRuleEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HostelFeeRuleEntity>;
}

export interface InstallmentPlanEntity {
  id: string;
  tenantId: string;
  academicSessionId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface InstallmentPlanItemEntity {
  id: string;
  tenantId: string;
  installmentPlanId: string;
  installmentNumber: number;
  percentageOfTotal: number;
  dueDayOffset: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

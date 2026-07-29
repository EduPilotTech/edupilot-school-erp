export interface StudentFeeAssignmentEntity {
  id: string;
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  feeStructureId: string;
  installmentPlanId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

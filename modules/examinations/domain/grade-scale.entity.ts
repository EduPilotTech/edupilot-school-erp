export interface GradeScaleEntity {
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

export interface GradeBandEntity {
  id: string;
  tenantId: string;
  gradeScaleId: string;
  minPercentage: number;
  maxPercentage: number;
  grade: string;
  gradePoint: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

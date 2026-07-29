export type FeeNumberSequenceTypeValue = "INVOICE" | "RECEIPT";

export interface FeeNumberSequenceEntity {
  id: string;
  tenantId: string;
  academicSessionId: string;
  type: FeeNumberSequenceTypeValue;
  prefix: string;
  lastNumber: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
}

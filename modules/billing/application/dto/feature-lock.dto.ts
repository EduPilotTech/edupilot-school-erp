export interface FeatureLockResultDTO {
  locked: boolean;
  reason: string | null;
  allowed: boolean;
  limit: number | null;
}

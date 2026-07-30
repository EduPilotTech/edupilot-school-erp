// Title-level bibliographic record — one row per distinct title/edition, regardless of how many
// physical copies exist (see BookCopyEntity).
export interface BookEntity {
  id: string;
  tenantId: string;
  libraryId: string;
  bookCategoryId: string;
  authorId: string;
  publisherId: string;
  academicSubjectId: string | null;
  title: string;
  isbn: string | null;
  language: string;
  edition: string | null;
  description: string | null;
  replacementCost: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

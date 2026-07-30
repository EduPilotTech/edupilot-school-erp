import { z } from "zod";

// --- Book Category -----------------------------------------------------------------------------

export const createBookCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  code: z.string().trim().min(1, "Code is required."),
});
export type CreateBookCategoryServiceInput = z.infer<typeof createBookCategorySchema>;

export const updateBookCategorySchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateBookCategoryServiceInput = z.infer<typeof updateBookCategorySchema>;

export interface BookCategoryDTO {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  isActive: boolean;
}

// --- Author --------------------------------------------------------------------------------------

export const createAuthorSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  biography: z.string().trim().max(2000).optional(),
});
export type CreateAuthorServiceInput = z.infer<typeof createAuthorSchema>;

export const updateAuthorSchema = z.object({
  name: z.string().trim().min(1).optional(),
  biography: z.string().trim().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateAuthorServiceInput = z.infer<typeof updateAuthorSchema>;

export interface AuthorDTO {
  id: string;
  schoolId: string;
  name: string;
  biography: string | null;
  isActive: boolean;
}

// --- Publisher -----------------------------------------------------------------------------------

export const createPublisherSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
});
export type CreatePublisherServiceInput = z.infer<typeof createPublisherSchema>;

export const updatePublisherSchema = z.object({
  name: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});
export type UpdatePublisherServiceInput = z.infer<typeof updatePublisherSchema>;

export interface PublisherDTO {
  id: string;
  schoolId: string;
  name: string;
  isActive: boolean;
}

// --- Book ----------------------------------------------------------------------------------------

export const createBookSchema = z.object({
  libraryId: z.string().uuid("Library is required."),
  bookCategoryId: z.string().uuid("Category is required."),
  authorId: z.string().uuid("Author is required."),
  publisherId: z.string().uuid("Publisher is required."),
  academicSubjectId: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Title is required."),
  isbn: z.string().trim().max(32).optional(),
  language: z.string().trim().min(1, "Language is required."),
  edition: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  replacementCost: z.number().min(0).default(0),
});
export type CreateBookServiceInput = z.infer<typeof createBookSchema>;

export const updateBookSchema = z.object({
  bookCategoryId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  publisherId: z.string().uuid().optional(),
  academicSubjectId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).optional(),
  isbn: z.string().trim().max(32).nullable().optional(),
  language: z.string().trim().min(1).optional(),
  edition: z.string().trim().max(100).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  replacementCost: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateBookServiceInput = z.infer<typeof updateBookSchema>;

export interface BookDTO {
  id: string;
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
}

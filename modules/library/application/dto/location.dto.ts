import { z } from "zod";

// --- Rack ----------------------------------------------------------------------------------------

export const createRackSchema = z.object({
  libraryId: z.string().uuid("Library is required."),
  name: z.string().trim().min(1, "Name is required."),
  code: z.string().trim().min(1, "Code is required."),
});
export type CreateRackServiceInput = z.infer<typeof createRackSchema>;

export const updateRackSchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateRackServiceInput = z.infer<typeof updateRackSchema>;

export interface RackDTO {
  id: string;
  libraryId: string;
  name: string;
  code: string;
  isActive: boolean;
}

// --- Shelf ---------------------------------------------------------------------------------------

export const createShelfSchema = z.object({
  rackId: z.string().uuid("Rack is required."),
  name: z.string().trim().min(1, "Name is required."),
  code: z.string().trim().min(1, "Code is required."),
});
export type CreateShelfServiceInput = z.infer<typeof createShelfSchema>;

export const updateShelfSchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateShelfServiceInput = z.infer<typeof updateShelfSchema>;

export interface ShelfDTO {
  id: string;
  rackId: string;
  name: string;
  code: string;
  isActive: boolean;
}

// --- Book Copy -------------------------------------------------------------------------------------

export const createBookCopySchema = z.object({
  bookId: z.string().uuid("Book is required."),
  shelfId: z.string().uuid().optional(),
  accessionNumber: z.string().trim().min(1, "Accession number is required.").optional(),
});
export type CreateBookCopyServiceInput = z.infer<typeof createBookCopySchema>;

export const updateBookCopyShelfSchema = z.object({
  shelfId: z.string().uuid().nullable(),
});
export type UpdateBookCopyShelfServiceInput = z.infer<typeof updateBookCopyShelfSchema>;

export interface BookCopyDTO {
  id: string;
  bookId: string;
  shelfId: string | null;
  accessionNumber: string;
  status: "AVAILABLE" | "ISSUED" | "RESERVED" | "LOST" | "DAMAGED";
}

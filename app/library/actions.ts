"use server";

// Thin Server Actions only — no business logic here, matching every other actions.ts in this
// codebase. Covers all of Phase 12: Library/Settings master data, Book Catalog (Category/Author/
// Publisher/Book), Physical Inventory (Rack/Shelf/BookCopy), Circulation (Issue/Return/Renew/
// Lost/Damaged), Reservations, and Fine integration (generate invoice / waive).

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { createLibrary, updateLibrary, deleteLibrary } from "@/modules/library/application/library.service";
import { upsertLibrarySettings } from "@/modules/library/application/library-settings.service";
import {
  createBookCategory,
  updateBookCategory,
  deleteBookCategory,
} from "@/modules/library/application/book-category.service";
import { createAuthor, updateAuthor, deleteAuthor } from "@/modules/library/application/author.service";
import { createPublisher, updatePublisher, deletePublisher } from "@/modules/library/application/publisher.service";
import { createBook, updateBook, deleteBook } from "@/modules/library/application/book.service";
import { createRack, updateRack, deleteRack } from "@/modules/library/application/rack.service";
import { createShelf, updateShelf, deleteShelf } from "@/modules/library/application/shelf.service";
import {
  createBookCopy,
  updateBookCopyShelf,
  deleteBookCopy,
} from "@/modules/library/application/book-copy.service";
import {
  issueBook,
  renewBookIssue,
  returnBook,
  markBookLost,
  markBookDamaged,
} from "@/modules/library/application/book-circulation.service";
import {
  reserveBook,
  cancelReservation,
  fulfillReservation,
} from "@/modules/library/application/book-reservation.service";
import { generateLibraryFineInvoice, waiveBookIssueFine } from "@/modules/library/application/library-fine.service";
import { translateLibraryError, type ActionResult } from "./_lib/translate-library-error";
import type { LibraryDTO, LibrarySettingsDTO } from "@/modules/library/application/dto/library.dto";
import type { BookCategoryDTO, AuthorDTO, PublisherDTO, BookDTO } from "@/modules/library/application/dto/catalog.dto";
import type { RackDTO, ShelfDTO, BookCopyDTO } from "@/modules/library/application/dto/location.dto";
import type { BookIssueDTO } from "@/modules/library/application/dto/circulation.dto";
import type { BookReservationDTO } from "@/modules/library/application/dto/reservation.dto";
import type { FeeInvoiceDTO } from "@/modules/fees/application/dto/fee-invoice.dto";

// --- Library Master ------------------------------------------------------------------------------

export async function createLibraryAction(input: unknown): Promise<ActionResult<LibraryDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.manage");
  try {
    const library = await createLibrary(input, {
      tenantId: authContext.tenantId,
      schoolId: authContext.schoolId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: library };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function updateLibraryAction(libraryId: string, input: unknown): Promise<ActionResult<LibraryDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.manage");
  try {
    const library = await updateLibrary(libraryId, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: library };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function deleteLibraryAction(libraryId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.manage");
  try {
    await deleteLibrary(libraryId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function upsertLibrarySettingsAction(libraryId: string, input: unknown): Promise<ActionResult<LibrarySettingsDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.manage");
  try {
    const settings = await upsertLibrarySettings(libraryId, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: settings };
  } catch (error) {
    return translateLibraryError(error);
  }
}

// --- Book Catalog --------------------------------------------------------------------------------

export async function createBookCategoryAction(input: unknown): Promise<ActionResult<BookCategoryDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.catalog.manage");
  try {
    const category = await createBookCategory(input, {
      tenantId: authContext.tenantId,
      schoolId: authContext.schoolId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: category };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function updateBookCategoryAction(id: string, input: unknown): Promise<ActionResult<BookCategoryDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.catalog.manage");
  try {
    const category = await updateBookCategory(id, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: category };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function deleteBookCategoryAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.catalog.manage");
  try {
    await deleteBookCategory(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function createAuthorAction(input: unknown): Promise<ActionResult<AuthorDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.catalog.manage");
  try {
    const author = await createAuthor(input, {
      tenantId: authContext.tenantId,
      schoolId: authContext.schoolId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: author };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function updateAuthorAction(id: string, input: unknown): Promise<ActionResult<AuthorDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.catalog.manage");
  try {
    const author = await updateAuthor(id, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: author };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function deleteAuthorAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.catalog.manage");
  try {
    await deleteAuthor(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function createPublisherAction(input: unknown): Promise<ActionResult<PublisherDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.catalog.manage");
  try {
    const publisher = await createPublisher(input, {
      tenantId: authContext.tenantId,
      schoolId: authContext.schoolId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: publisher };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function updatePublisherAction(id: string, input: unknown): Promise<ActionResult<PublisherDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.catalog.manage");
  try {
    const publisher = await updatePublisher(id, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: publisher };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function deletePublisherAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.catalog.manage");
  try {
    await deletePublisher(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function createBookAction(input: unknown): Promise<ActionResult<BookDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.catalog.manage");
  try {
    const book = await createBook(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: book };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function updateBookAction(id: string, input: unknown): Promise<ActionResult<BookDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.catalog.manage");
  try {
    const book = await updateBook(id, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: book };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function deleteBookAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.catalog.manage");
  try {
    await deleteBook(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateLibraryError(error);
  }
}

// --- Physical Inventory ---------------------------------------------------------------------------

export async function createRackAction(input: unknown): Promise<ActionResult<RackDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.inventory.manage");
  try {
    const rack = await createRack(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: rack };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function updateRackAction(id: string, input: unknown): Promise<ActionResult<RackDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.inventory.manage");
  try {
    const rack = await updateRack(id, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: rack };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function deleteRackAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.inventory.manage");
  try {
    await deleteRack(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function createShelfAction(input: unknown): Promise<ActionResult<ShelfDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.inventory.manage");
  try {
    const shelf = await createShelf(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: shelf };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function updateShelfAction(id: string, input: unknown): Promise<ActionResult<ShelfDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.inventory.manage");
  try {
    const shelf = await updateShelf(id, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: shelf };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function deleteShelfAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.inventory.manage");
  try {
    await deleteShelf(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function createBookCopyAction(input: unknown): Promise<ActionResult<BookCopyDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.inventory.manage");
  try {
    const copy = await createBookCopy(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: copy };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function updateBookCopyShelfAction(id: string, input: unknown): Promise<ActionResult<BookCopyDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.inventory.manage");
  try {
    const copy = await updateBookCopyShelf(id, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: copy };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function deleteBookCopyAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.inventory.manage");
  try {
    await deleteBookCopy(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateLibraryError(error);
  }
}

// --- Circulation -----------------------------------------------------------------------------------

export async function issueBookAction(input: unknown): Promise<ActionResult<BookIssueDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.circulation.manage");
  try {
    const issue = await issueBook(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: issue };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function renewBookIssueAction(issueId: string, input: unknown): Promise<ActionResult<BookIssueDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.circulation.manage");
  try {
    const issue = await renewBookIssue(issueId, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: issue };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function returnBookAction(issueId: string, input: unknown): Promise<ActionResult<BookIssueDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.circulation.manage");
  try {
    const issue = await returnBook(issueId, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: issue };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function markBookLostAction(issueId: string, input: unknown): Promise<ActionResult<BookIssueDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.circulation.manage");
  try {
    const issue = await markBookLost(issueId, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: issue };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function markBookDamagedAction(issueId: string, input: unknown): Promise<ActionResult<BookIssueDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.circulation.manage");
  try {
    const issue = await markBookDamaged(issueId, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: issue };
  } catch (error) {
    return translateLibraryError(error);
  }
}

// --- Reservations -------------------------------------------------------------------------------

export async function reserveBookAction(input: unknown): Promise<ActionResult<BookReservationDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.reservation.manage");
  try {
    const reservation = await reserveBook(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: reservation };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function cancelReservationAction(reservationId: string): Promise<ActionResult<BookReservationDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.reservation.manage");
  try {
    const reservation = await cancelReservation(reservationId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: reservation };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function fulfillReservationAction(reservationId: string): Promise<ActionResult<BookReservationDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.reservation.manage");
  try {
    const reservation = await fulfillReservation(reservationId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: reservation };
  } catch (error) {
    return translateLibraryError(error);
  }
}

// --- Fine Integration ------------------------------------------------------------------------------

export async function generateLibraryFineInvoiceAction(bookIssueId: string, input: unknown): Promise<ActionResult<FeeInvoiceDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.fine.manage");
  try {
    const invoice = await generateLibraryFineInvoice(bookIssueId, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: invoice };
  } catch (error) {
    return translateLibraryError(error);
  }
}

export async function waiveBookIssueFineAction(issueId: string, input: unknown): Promise<ActionResult<BookIssueDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("library.fine.manage");
  try {
    const issue = await waiveBookIssueFine(issueId, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: issue };
  } catch (error) {
    return translateLibraryError(error);
  }
}

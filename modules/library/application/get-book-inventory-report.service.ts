import "server-only";
import { PrismaBookRepository } from "../infrastructure/prisma-book.repository";
import { PrismaBookCopyRepository } from "../infrastructure/prisma-book-copy.repository";
import type { BookInventoryRowDTO } from "./dto/reports.dto";

// Book Inventory Report — total/available/issued/reserved/lost/damaged copy counts per title in
// a library.
export async function getBookInventoryReport(tenantId: string, libraryId: string): Promise<BookInventoryRowDTO[]> {
  const bookRepository = new PrismaBookRepository();
  const copyRepository = new PrismaBookCopyRepository();

  const books = await bookRepository.findByLibrary(tenantId, libraryId);
  const rows: BookInventoryRowDTO[] = [];

  for (const book of books) {
    const copies = await copyRepository.findByBook(tenantId, book.id);
    rows.push({
      bookId: book.id,
      title: book.title,
      totalCopies: copies.length,
      available: copies.filter((c) => c.status === "AVAILABLE").length,
      issued: copies.filter((c) => c.status === "ISSUED").length,
      reserved: copies.filter((c) => c.status === "RESERVED").length,
      lost: copies.filter((c) => c.status === "LOST").length,
      damaged: copies.filter((c) => c.status === "DAMAGED").length,
    });
  }

  return rows;
}

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listLibraries } from "@/modules/library/application/library.service";
import { listBooksByLibrary } from "@/modules/library/application/book.service";
import { listReservationsByBook } from "@/modules/library/application/book-reservation.service";
import { listStudents } from "@/modules/students/application/list-students.service";
import { listTeachers } from "@/modules/teachers/application/list-teachers.service";
import { listUsers } from "@/modules/users/application/list-users.service";
import { ReservationManager } from "@/components/features/library/ReservationManager";

interface ReservationsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ReservationsPage({ searchParams }: ReservationsPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("library.reservation.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const libraries = await listLibraries({ tenantId: authContext.tenantId }, { isActive: true });
  const libraryId = first(params.libraryId) || libraries[0]?.id || "";
  const books = libraryId ? await listBooksByLibrary(authContext.tenantId, libraryId, { isActive: true }) : [];
  const bookId = first(params.bookId) || books[0]?.id || "";

  const [reservations, studentResult, teachers, userResult] = await Promise.all([
    bookId ? listReservationsByBook(authContext.tenantId, bookId) : Promise.resolve([]),
    listStudents({ page: 1, pageSize: 200 }, { tenantId: authContext.tenantId }),
    listTeachers({ tenantId: authContext.tenantId }),
    listUsers({ page: 1, pageSize: 200 }, { tenantId: authContext.tenantId }),
  ]);

  const students = studentResult.items.map((s) => ({ id: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` }));
  const teacherOptions = teachers.map((t) => ({ id: t.id, label: t.fullName }));
  const staff = userResult.items.map((u) => ({ id: u.id, label: u.fullName }));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Reservations</h1>
      <p className="mt-1 text-sm text-zinc-500">A reservation is on the title — the member is notified when any copy becomes available.</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="libraryId" className="text-xs font-medium text-zinc-500">
            Library
          </label>
          <select
            id="libraryId"
            name="libraryId"
            defaultValue={libraryId}
            className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {libraries.map((library) => (
              <option key={library.id} value={library.id}>
                {library.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="bookId" className="text-xs font-medium text-zinc-500">
            Book
          </label>
          <select
            id="bookId"
            name="bookId"
            defaultValue={bookId}
            className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Load
        </button>
      </form>

      <div className="mt-6">
        {bookId ? (
          <ReservationManager bookId={bookId} items={reservations} students={students} teachers={teacherOptions} staff={staff} />
        ) : (
          <p className="text-sm text-zinc-500">Add a book first.</p>
        )}
      </div>
    </main>
  );
}

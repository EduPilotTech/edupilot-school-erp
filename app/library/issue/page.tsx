import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listLibraries } from "@/modules/library/application/library.service";
import { listBooksByLibrary } from "@/modules/library/application/book.service";
import { listBookCopiesByBook } from "@/modules/library/application/book-copy.service";
import { listStudents } from "@/modules/students/application/list-students.service";
import { listTeachers } from "@/modules/teachers/application/list-teachers.service";
import { listUsers } from "@/modules/users/application/list-users.service";
import { IssueCounter } from "@/components/features/library/IssueCounter";

interface IssuePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function IssuePage({ searchParams }: IssuePageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("library.circulation.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const libraries = await listLibraries({ tenantId: authContext.tenantId }, { isActive: true });
  const libraryId = first(params.libraryId) || libraries[0]?.id || "";

  const books = libraryId ? await listBooksByLibrary(authContext.tenantId, libraryId, { isActive: true }) : [];
  const copyLists = await Promise.all(books.map((book) => listBookCopiesByBook(authContext.tenantId, book.id)));
  const availableCopies = books.flatMap((book, index) =>
    copyLists[index]
      .filter((copy) => copy.status === "AVAILABLE")
      .map((copy) => ({ id: copy.id, label: `${book.title} — ${copy.accessionNumber}` }))
  );

  const [studentResult, teachers, userResult] = await Promise.all([
    listStudents({ page: 1, pageSize: 200 }, { tenantId: authContext.tenantId }),
    listTeachers({ tenantId: authContext.tenantId }),
    listUsers({ page: 1, pageSize: 200 }, { tenantId: authContext.tenantId }),
  ]);

  const students = studentResult.items.map((s) => ({ id: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` }));
  const teacherOptions = teachers.map((t) => ({ id: t.id, label: t.fullName }));
  const staff = userResult.items.map((u) => ({ id: u.id, label: u.fullName }));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Issue Counter</h1>
      <p className="mt-1 text-sm text-zinc-500">Check out a book to a student, teacher, or staff member.</p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="libraryId" className="text-xs font-medium text-zinc-500">
            Library
          </label>
          <select
            id="libraryId"
            name="libraryId"
            defaultValue={libraryId}
            className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {libraries.map((library) => (
              <option key={library.id} value={library.id}>
                {library.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Switch Library
        </button>
      </form>

      <div className="mt-6">
        <IssueCounter availableCopies={availableCopies} students={students} teachers={teacherOptions} staff={staff} />
      </div>
    </main>
  );
}

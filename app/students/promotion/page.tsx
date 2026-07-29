import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listClasses } from "@/modules/academics/application/list-classes.service";
import { listSections } from "@/modules/academics/application/list-sections.service";
import { listStudents } from "@/modules/students/application/list-students.service";
import { PromotionForm } from "@/components/features/students/PromotionForm";

interface PromotionPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PromotionPage({ searchParams }: PromotionPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("student.promote");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sourceAcademicSessionId = first(params.sourceAcademicSessionId) ?? "";
  const targetAcademicSessionId = first(params.targetAcademicSessionId) ?? "";
  const sourceClassId = first(params.sourceClassId) ?? "";
  const sourceSectionId = first(params.sourceSectionId) ?? "";

  const [sessions, classes, sections] = await Promise.all([
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
    listClasses({ tenantId: authContext.tenantId }),
    listSections({ tenantId: authContext.tenantId }),
  ]);

  const hasScope = Boolean(sourceAcademicSessionId && targetAcademicSessionId && sourceClassId && sourceSectionId);
  const roster = hasScope
    ? await listStudents(
        { academicSessionId: sourceAcademicSessionId, classId: sourceClassId, sectionId: sourceSectionId, page: 1, pageSize: 500 },
        { tenantId: authContext.tenantId }
      )
    : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Promotion</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Promotes students from their current class/section into a new academic session — closes their current
        enrollment and opens a new one, preserving full enrollment history.
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="sourceAcademicSessionId" className="text-xs font-medium text-zinc-500">
            From Session
          </label>
          <select
            id="sourceAcademicSessionId"
            name="sourceAcademicSessionId"
            defaultValue={sourceAcademicSessionId}
            required
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select session</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sourceClassId" className="text-xs font-medium text-zinc-500">
            From Class
          </label>
          <select
            id="sourceClassId"
            name="sourceClassId"
            defaultValue={sourceClassId}
            required
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sourceSectionId" className="text-xs font-medium text-zinc-500">
            From Section
          </label>
          <select
            id="sourceSectionId"
            name="sourceSectionId"
            defaultValue={sourceSectionId}
            required
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="targetAcademicSessionId" className="text-xs font-medium text-zinc-500">
            To Session
          </label>
          <select
            id="targetAcademicSessionId"
            name="targetAcademicSessionId"
            defaultValue={targetAcademicSessionId}
            required
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select session</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionName}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Load Roster
        </button>
      </form>

      <div className="mt-8">
        {!hasScope && <p className="text-sm text-zinc-500">Choose the source and target scope above, then click Load Roster.</p>}
        {hasScope && roster && (
          <PromotionForm
            sourceAcademicSessionId={sourceAcademicSessionId}
            targetAcademicSessionId={targetAcademicSessionId}
            rows={roster.items.map((student) => ({
              studentId: student.id,
              admissionNumber: student.admissionNumber,
              fullName: `${student.firstName} ${student.lastName}`,
            }))}
            classOptions={classes.map((c) => ({ id: c.id, name: c.name }))}
            sectionOptions={sections.map((s) => ({ id: s.id, name: s.name }))}
          />
        )}
      </div>
    </main>
  );
}

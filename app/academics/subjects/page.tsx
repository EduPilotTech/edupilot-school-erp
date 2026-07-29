import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can, requirePermission } from "@/lib/auth/rbac";
import { listSubjects } from "@/modules/academics/application/list-subjects.service";
import { SubjectManager } from "@/components/features/academics/SubjectManager";

export default async function SubjectsPage() {
  const authContext = await requireAuthContext();
  await requirePermission("subject.view");
  const authorization = await getAuthorizationContext();

  const subjects = await listSubjects({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Subjects</h1>
      <p className="mt-1 text-sm text-zinc-500">Subjects offered by the school, reused across academic sessions.</p>

      <div className="mt-6">
        <SubjectManager
          items={subjects.map((s) => ({ id: s.id, schoolId: s.schoolId, name: s.name, code: s.code, isActive: s.isActive }))}
          canManage={can(authorization, "subject.manage")}
        />
      </div>
    </main>
  );
}

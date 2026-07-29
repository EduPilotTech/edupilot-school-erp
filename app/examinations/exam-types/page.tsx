import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can, requirePermission } from "@/lib/auth/rbac";
import { listExamTypes } from "@/modules/examinations/application/list-exam-types.service";
import { ExamTypeManager } from "@/components/features/examinations/ExamTypeManager";

export default async function ExamTypesPage() {
  const authContext = await requireAuthContext();
  await requirePermission("examtype.view");
  const authorization = await getAuthorizationContext();

  const examTypes = await listExamTypes({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Exam Types</h1>
      <p className="mt-1 text-sm text-zinc-500">Exam types offered by the school, reused across academic sessions.</p>

      <div className="mt-6">
        <ExamTypeManager
          items={examTypes.map((et) => ({ id: et.id, name: et.name, code: et.code, isActive: et.isActive }))}
          canManage={can(authorization, "examtype.manage")}
        />
      </div>
    </main>
  );
}

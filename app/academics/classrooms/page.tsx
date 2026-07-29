import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can, requirePermission } from "@/lib/auth/rbac";
import { listClassrooms } from "@/modules/academics/application/list-classrooms.service";
import { ClassroomManager } from "@/components/features/academics/ClassroomManager";

export default async function ClassroomsPage() {
  const authContext = await requireAuthContext();
  await requirePermission("classroom.view");
  const authorization = await getAuthorizationContext();

  const classrooms = await listClassrooms({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Classrooms</h1>
      <p className="mt-1 text-sm text-zinc-500">Physical rooms and labs available for scheduling.</p>

      <div className="mt-6">
        <ClassroomManager
          items={classrooms.map((c) => ({
            id: c.id,
            schoolId: c.schoolId,
            name: c.name,
            code: c.code,
            capacity: c.capacity,
            isActive: c.isActive,
          }))}
          canManage={can(authorization, "classroom.manage")}
        />
      </div>
    </main>
  );
}

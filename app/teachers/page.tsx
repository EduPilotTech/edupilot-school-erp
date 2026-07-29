import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can, requirePermission } from "@/lib/auth/rbac";
import { listTeachers } from "@/modules/teachers/application/list-teachers.service";
import { listAvailableRoles } from "@/modules/users/application/list-available-roles.service";
import { listUsers } from "@/modules/users/application/list-users.service";
import { TeacherManager } from "@/components/features/teachers/TeacherManager";

const TEACHER_ROLE_CODES = new Set(["TEACHER", "CLASS_TEACHER"]);

export default async function TeachersPage() {
  const authContext = await requireAuthContext();
  await requirePermission("teacher.view");
  const authorization = await getAuthorizationContext();

  const teachers = await listTeachers({ tenantId: authContext.tenantId });
  const alreadyPromoted = new Set(teachers.map((t) => t.userProfileId));

  const roles = await listAvailableRoles({ tenantId: authContext.tenantId });
  const teacherRoleIds = roles.filter((role) => role.code && TEACHER_ROLE_CODES.has(role.code)).map((r) => r.id);

  const userLists = await Promise.all(
    teacherRoleIds.map((roleId) =>
      listUsers({ roleId, page: 1, pageSize: 100 }, { tenantId: authContext.tenantId })
    )
  );

  const candidateMap = new Map<string, { id: string; fullName: string; email: string | null }>();
  for (const list of userLists) {
    for (const user of list.items) {
      if (!alreadyPromoted.has(user.id) && user.deletedAt === null) {
        candidateMap.set(user.id, { id: user.id, fullName: user.fullName, email: user.email });
      }
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Teachers</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Teaching staff, promoted from existing users holding the Teacher or Class Teacher role.
      </p>

      <div className="mt-6">
        <TeacherManager
          items={teachers}
          candidates={[...candidateMap.values()]}
          canManage={can(authorization, "teacher.manage")}
        />
      </div>
    </main>
  );
}

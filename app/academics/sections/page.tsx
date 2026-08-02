import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can, requirePermission } from "@/lib/auth/rbac";
import { listClasses } from "@/modules/academics/application/list-classes.service";
import { listSections } from "@/modules/academics/application/list-sections.service";
import { SectionManager } from "@/components/features/academics/SectionManager";

export default async function SectionsPage() {
  const authContext = await requireAuthContext();
  await requirePermission("section.view");
  const authorization = await getAuthorizationContext();

  const [classes, sections] = await Promise.all([
    listClasses({ tenantId: authContext.tenantId }),
    listSections({ tenantId: authContext.tenantId }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Sections</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Sections subdivide a class (e.g. Class I - A, Class I - B).
      </p>

      <div className="mt-6">
        <SectionManager
          items={sections.map((s) => ({ id: s.id, classId: s.classId, name: s.name, capacity: s.capacity }))}
          classes={classes.map((c) => ({ id: c.id, name: c.name }))}
          canManage={can(authorization, "section.manage")}
        />
      </div>
    </main>
  );
}

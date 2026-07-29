import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listClasses } from "@/modules/academics/application/list-classes.service";
import { listSections } from "@/modules/academics/application/list-sections.service";
import { listSubjects } from "@/modules/academics/application/list-subjects.service";
import { listHomeworkForTeacher } from "@/modules/communication/application/list-homework.service";
import { PrismaTeacherRepository } from "@/modules/teachers/infrastructure/prisma-teacher.repository";
import { HomeworkManager } from "@/components/features/communication/HomeworkManager";

export default async function CommunicationHomeworkPage() {
  const authContext = await requireAuthContext();
  await requirePermission("communication.homework.view");
  const authorization = await getAuthorizationContext();

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0];

  const teacherRepository = new PrismaTeacherRepository();
  const teacher = await teacherRepository.findByUserProfileId(authContext.tenantId, authContext.userId);

  const [classes, sections, subjects, homework] = await Promise.all([
    listClasses({ tenantId: authContext.tenantId }, currentSession?.id),
    listSections({ tenantId: authContext.tenantId }),
    listSubjects({ tenantId: authContext.tenantId }),
    teacher ? listHomeworkForTeacher(authContext.tenantId, teacher.id) : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Homework</h1>
      <p className="mt-1 text-sm text-zinc-500">Assign homework to a class or section. View-only for parents.</p>

      <div className="mt-6">
        {currentSession ? (
          <HomeworkManager
            academicSessionId={currentSession.id}
            items={homework}
            classes={classes.map((c) => ({ id: c.id, name: c.name }))}
            sections={sections.map((s) => ({ id: s.id, name: s.name }))}
            subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
            canManage={can(authorization, "communication.homework.manage") && !!teacher}
          />
        ) : (
          <p className="text-sm text-zinc-500">No active academic session found.</p>
        )}
      </div>
    </main>
  );
}

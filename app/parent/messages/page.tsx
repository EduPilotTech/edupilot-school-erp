import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listMyThreads } from "@/modules/parents/application/list-my-threads.service";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaTeacherRepository } from "@/modules/teachers/infrastructure/prisma-teacher.repository";
import { PrismaUserProfileRepository } from "@/modules/users/infrastructure/prisma-user-profile.repository";

// Parent <-> Teacher Messaging (requirement 17) — thread list.
export default async function ParentMessagesPage() {
  const authContext = await requireAuthContext();
  await requirePermission("parent.message.view");

  const threads = await listMyThreads({ tenantId: authContext.tenantId, userProfileId: authContext.userId });

  const studentRepository = new PrismaStudentRepository();
  const teacherRepository = new PrismaTeacherRepository();
  const userProfileRepository = new PrismaUserProfileRepository();

  const rows = await Promise.all(
    threads.map(async (thread) => {
      const [student, teacher] = await Promise.all([
        studentRepository.findById(authContext.tenantId, thread.studentId),
        teacherRepository.findById(authContext.tenantId, thread.teacherId),
      ]);
      const teacherProfile = teacher
        ? await userProfileRepository.findById(authContext.tenantId, teacher.userProfileId)
        : null;
      return {
        id: thread.id,
        subject: thread.subject ?? "(No subject)",
        studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
        teacherName: teacherProfile?.fullName ?? "Unknown",
        updatedAt: thread.updatedAt,
      };
    })
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Messages</h1>
        <Link
          href="/parent/messages/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          New Message
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {rows.map((row) => (
          <Link
            key={row.id}
            href={`/parent/messages/${row.id}`}
            className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-400"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">{row.subject}</h2>
              <span className="text-xs text-zinc-500">{new Date(row.updatedAt).toLocaleDateString()}</span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {row.studentName} · {row.teacherName}
            </p>
          </Link>
        ))}
        {rows.length === 0 && <p className="text-sm text-zinc-500">No conversations yet.</p>}
      </div>
    </main>
  );
}

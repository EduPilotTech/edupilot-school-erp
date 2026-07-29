import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listThreadsForTeacher } from "@/modules/communication/application/list-threads-for-teacher.service";
import { PrismaTeacherRepository } from "@/modules/teachers/infrastructure/prisma-teacher.repository";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaGuardianRepository } from "@/modules/students/infrastructure/prisma-guardian.repository";

// Parent <-> Teacher Messaging (requirement 17), the teacher-facing thread list.
export default async function CommunicationMessagesPage() {
  const authContext = await requireAuthContext();
  await requirePermission("communication.message.view");

  const teacherRepository = new PrismaTeacherRepository();
  const teacher = await teacherRepository.findByUserProfileId(authContext.tenantId, authContext.userId);
  const threads = teacher ? await listThreadsForTeacher(authContext.tenantId, teacher.id) : [];

  const studentRepository = new PrismaStudentRepository();
  const guardianRepository = new PrismaGuardianRepository();

  const rows = await Promise.all(
    threads.map(async (thread) => {
      const [student, guardian] = await Promise.all([
        studentRepository.findById(authContext.tenantId, thread.studentId),
        guardianRepository.findById(authContext.tenantId, thread.guardianId),
      ]);
      return {
        id: thread.id,
        subject: thread.subject ?? "(No subject)",
        studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
        guardianName: guardian?.fullName ?? "Unknown",
        updatedAt: thread.updatedAt,
      };
    })
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Messages</h1>

      <div className="mt-6 flex flex-col gap-2">
        {rows.map((row) => (
          <Link
            key={row.id}
            href={`/communication/messages/${row.id}`}
            className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-400"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">{row.subject}</h2>
              <span className="text-xs text-zinc-500">{new Date(row.updatedAt).toLocaleDateString()}</span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {row.studentName} · {row.guardianName}
            </p>
          </Link>
        ))}
        {rows.length === 0 && <p className="text-sm text-zinc-500">No conversations yet.</p>}
      </div>
    </main>
  );
}

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getThreadMessages } from "@/modules/communication/application/get-thread-messages.service";
import { TeacherMessageComposer } from "@/components/features/communication/TeacherMessageComposer";

interface PageProps {
  params: Promise<{ threadId: string }>;
}

export default async function CommunicationThreadPage({ params }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("communication.message.view");
  const { threadId } = await params;

  const thread = await getThreadMessages(authContext.tenantId, threadId, authContext.userId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">{thread.subject ?? "Conversation"}</h1>

      <div className="mt-6 flex flex-col gap-3">
        {thread.messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[80%] rounded-xl p-3 text-sm ${
              message.senderRole === "TEACHER" ? "self-end bg-blue-600 text-white" : "self-start bg-zinc-100 text-zinc-900"
            }`}
          >
            <p>{message.body}</p>
            <p className="mt-1 text-xs opacity-70">{new Date(message.sentAt).toLocaleString()}</p>
          </div>
        ))}
        {thread.messages.length === 0 && <p className="text-sm text-zinc-500">No messages yet.</p>}
      </div>

      <div className="mt-6">
        <TeacherMessageComposer studentId={thread.studentId} guardianId={thread.guardianId} />
      </div>
    </main>
  );
}

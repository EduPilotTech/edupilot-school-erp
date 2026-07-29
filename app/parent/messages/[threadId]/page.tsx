import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getThreadMessages } from "@/modules/communication/application/get-thread-messages.service";
import { MessageComposer } from "@/components/features/parents/MessageComposer";

interface PageProps {
  params: Promise<{ threadId: string }>;
}

// Opening the thread also marks every message sent TO this reader as read
// (getThreadMessages -> markThreadAsRead).
export default async function ParentThreadPage({ params }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("parent.message.view");
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
              message.senderRole === "PARENT" ? "self-end bg-blue-600 text-white" : "self-start bg-zinc-100 text-zinc-900"
            }`}
          >
            <p>{message.body}</p>
            <p className="mt-1 text-xs opacity-70">{new Date(message.sentAt).toLocaleString()}</p>
          </div>
        ))}
        {thread.messages.length === 0 && <p className="text-sm text-zinc-500">No messages yet.</p>}
      </div>

      <div className="mt-6">
        <MessageComposer studentId={thread.studentId} teacherId={thread.teacherId} />
      </div>
    </main>
  );
}

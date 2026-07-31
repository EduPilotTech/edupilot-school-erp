import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getMyDocuments } from "@/modules/hr/application/employee-portal.service";
import { EmployeeNotFoundError } from "@/modules/hr/domain/errors";
import { resolveCurrentEmployeeId } from "../_lib/resolve-current-employee";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  PHOTO: "Photo",
  RESUME: "Resume",
  IDENTITY_PROOF: "Identity Proof",
  BANK_PROOF: "Bank Proof",
  MEDICAL_CERTIFICATE: "Medical Certificate",
  POLICE_VERIFICATION: "Police Verification",
  APPOINTMENT_LETTER: "Appointment Letter",
  JOINING_LETTER: "Joining Letter",
  PROMOTION_LETTER: "Promotion Letter",
  WARNING_LETTER: "Warning Letter",
  EXPERIENCE_CERTIFICATE: "Experience Certificate",
  RELIEVING_LETTER: "Relieving Letter",
  OTHER: "Other",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// My Documents — read-only list, download only (no upload/delete here; those remain HR-managed
// in app/hr/employees/[employeeId]'s DocumentsTab). Download resolves through `signedUrl`,
// already present on EmployeeDocumentListItemDTO (generated server-side by getMyDocuments), same
// pattern as the admin Documents tab.
export default async function EmployeePortalDocumentsPage() {
  const authContext = await requireAuthContext();
  await requirePermission("employee.portal.access");

  let employeeId: string;
  try {
    employeeId = await resolveCurrentEmployeeId(authContext.tenantId, authContext.userId);
  } catch (error) {
    if (error instanceof EmployeeNotFoundError) {
      return (
        <main className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-semibold text-zinc-900">My Documents</h1>
          <p className="mt-4 text-sm text-zinc-500">No employee record is linked to your account. Contact HR.</p>
        </main>
      );
    }
    throw error;
  }

  const documents = await getMyDocuments(authContext.tenantId, employeeId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/employee-portal" className="text-sm text-blue-600 hover:underline">
        ← Employee Portal
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">My Documents</h1>
      <p className="mt-1 text-sm text-zinc-500">Documents and letters on file with HR.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Size</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {documents.map((document) => (
              <tr key={document.id}>
                <td className="max-w-[220px] truncate px-4 py-2 text-zinc-900" title={document.originalFileName}>
                  {document.originalFileName}
                </td>
                <td className="px-4 py-2 text-zinc-600">{DOCUMENT_TYPE_LABELS[document.documentType] ?? document.documentType}</td>
                <td className="px-4 py-2 text-zinc-600">{formatFileSize(document.fileSize)}</td>
                <td className="px-4 py-2 text-zinc-600">{(document.issuedDate ?? document.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-right">
                  <a href={document.signedUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {documents.length === 0 && <p className="p-4 text-sm text-zinc-500">No documents uploaded yet.</p>}
      </div>
    </main>
  );
}

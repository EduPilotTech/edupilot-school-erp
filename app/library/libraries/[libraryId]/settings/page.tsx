import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getLibrary } from "@/modules/library/application/library.service";
import { getLibrarySettings } from "@/modules/library/application/library-settings.service";
import { LibrarySettingsForm } from "@/components/features/library/LibrarySettingsForm";

interface PageProps {
  params: Promise<{ libraryId: string }>;
}

export default async function LibrarySettingsPage({ params }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("library.manage");
  const { libraryId } = await params;

  const library = await getLibrary(authContext.tenantId, libraryId);
  if (!library) notFound();

  const settings = await getLibrarySettings(authContext.tenantId, libraryId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">{library.name} — Settings</h1>
      <p className="mt-1 text-sm text-zinc-500">Loan period, borrow limits, renewals, and reservation hold policy.</p>
      <div className="mt-6">
        <LibrarySettingsForm libraryId={libraryId} settings={settings} />
      </div>
    </main>
  );
}

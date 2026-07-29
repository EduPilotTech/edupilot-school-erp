import { Card } from "@/components/ui/Card";
import { StudentPhotoUploader } from "./student-photo-uploader";
import { StudentDocumentUpload } from "./student-document-upload";
import { StudentDocumentList } from "./student-document-list";
import type { StudentDocumentListItemDTO } from "@/modules/students/application/dto/student-document.dto";

interface DocumentsTabContentProps {
  studentId: string;
  fullName: string;
  documents: StudentDocumentListItemDTO[];
  canUploadDocuments: boolean;
  canUploadPhoto: boolean;
  canDelete: boolean;
}

// Composes the Photo widget + upload queue + document list into the Student Profile page's
// "Documents" tab. A plain Server Component (no "use client") — it renders the Client
// Component children below but does no interactivity itself.
export function DocumentsTabContent({
  studentId,
  fullName,
  documents,
  canUploadDocuments,
  canUploadPhoto,
  canDelete,
}: DocumentsTabContentProps) {
  const photo = documents.find((doc) => doc.documentType === "PHOTO") ?? null;

  return (
    <div className="flex flex-col gap-6">
      <Card title="Photo">
        <StudentPhotoUploader
          studentId={studentId}
          fullName={fullName}
          photo={photo}
          canUpload={canUploadPhoto}
          canDelete={canDelete}
        />
      </Card>

      {canUploadDocuments && (
        <Card title="Upload Document" description="Birth certificate, transfer certificate, and other records.">
          <StudentDocumentUpload studentId={studentId} />
        </Card>
      )}

      <Card title="Documents">
        <StudentDocumentList
          studentId={studentId}
          documents={documents}
          canUpload={canUploadDocuments}
          canDelete={canDelete}
        />
      </Card>
    </div>
  );
}

import { listCoiDocuments } from "@/lib/services/coi";
import { CoiUploadForm } from "@/components/coi/coi-upload-form";
import { CoiTable } from "@/components/coi/coi-table";

export default async function DashboardPage() {
  const documents = await listCoiDocuments();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Portfolio
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">
          Certificate of Insurance submissions
        </h2>
        <p className="mt-1.5 max-w-2xl text-xs text-muted-foreground">
          Upload tenant COIs, track submission status, and open stored documents from Cloudinary.
        </p>
      </div>

      <CoiUploadForm />
      <CoiTable documents={documents} />
    </div>
  );
}

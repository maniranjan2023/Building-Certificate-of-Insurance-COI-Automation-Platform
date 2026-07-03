import { listCoiDocumentsWithLatestJob } from "@/lib/services/coi";
import { CoiUploadForm } from "@/components/coi/coi-upload-form";
import { CoiTable } from "@/components/coi/coi-table";

export default async function DashboardPage() {
  const documents = await listCoiDocumentsWithLatestJob();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Portfolio
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          Certificate of Insurance submissions
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Upload tenant COIs or receive them via email. Each submission enqueues a
          BullMQ job for processing.
        </p>
      </div>

      <CoiUploadForm />
      <CoiTable documents={documents} />
    </div>
  );
}

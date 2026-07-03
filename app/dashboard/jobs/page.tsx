import { listCoiJobs, listDlqJobs } from "@/lib/services/jobs";
import { JobsTable } from "@/components/jobs/jobs-table";

export default async function JobsPage() {
  const [jobs, dlqJobs] = await Promise.all([listCoiJobs(), listDlqJobs()]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Automation
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          Job queue & DLQ
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Track COI processing jobs from dashboard uploads and AgentMail intake.
          Failed jobs land in the dead letter queue after exponential backoff retries.
        </p>
      </div>

      <JobsTable jobs={jobs} dlqJobs={dlqJobs} />
    </div>
  );
}

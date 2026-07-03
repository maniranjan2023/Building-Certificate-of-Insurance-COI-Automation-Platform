import type { JobStatus } from "@prisma/client";

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  QUEUED: "Queued",
  PROCESSING: "Processing",
  READY_FOR_REVIEW: "Ready for Review",
  FAILED: "Failed",
  DLQ: "DLQ",
};

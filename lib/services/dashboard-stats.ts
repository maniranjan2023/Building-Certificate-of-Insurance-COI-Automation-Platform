import type { CoiStatus, JobStatus } from "@prisma/client";
import type { CoiSubmissionRow } from "@/lib/services/coi";

export interface PortfolioStats {
  total: number;
  pendingReview: number;
  accepted: number;
  rejected: number;
  processing: number;
  readyForReview: number;
  failedJobs: number;
  uniqueTenants: number;
}

export function computePortfolioStats(
  documents: CoiSubmissionRow[]
): PortfolioStats {
  const tenantIds = new Set<string>();
  let pendingReview = 0;
  let accepted = 0;
  let rejected = 0;
  let processing = 0;
  let readyForReview = 0;
  let failedJobs = 0;

  for (const submission of documents) {
    tenantIds.add(submission.senderId);

    switch (submission.status as CoiStatus) {
      case "PENDING_REVIEW":
        pendingReview++;
        break;
      case "ACCEPTED":
        accepted++;
        break;
      case "REJECTED":
        rejected++;
        break;
      default:
        break;
    }

    const jobStatus = submission.latestJob?.status as JobStatus | undefined;
    if (jobStatus === "PROCESSING" || jobStatus === "QUEUED") processing++;
    if (jobStatus === "READY_FOR_REVIEW") readyForReview++;
    if (jobStatus === "FAILED" || jobStatus === "DLQ") failedJobs++;
  }

  return {
    total: documents.length,
    pendingReview,
    accepted,
    rejected,
    processing,
    readyForReview,
    failedJobs,
    uniqueTenants: tenantIds.size,
  };
}

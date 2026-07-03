import { JobStatus } from "@prisma/client";
import { isDlqTestMode } from "@/lib/env";
import type { ProcessCoiJobData } from "@/lib/queue/coi-queue";
import { updateCoiJobStatus } from "@/lib/services/jobs";

const STUB_PROCESSING_MS = 1500;

function shouldForceFail(data: ProcessCoiJobData): boolean {
  if (data.forceFail === true) {
    return true;
  }
  return isDlqTestMode();
}

export async function handleProcessCoiJob(
  data: ProcessCoiJobData
): Promise<void> {
  if (shouldForceFail(data)) {
    throw new Error("Forced failure for DLQ testing (forceFail enabled).");
  }

  await new Promise((resolve) => setTimeout(resolve, STUB_PROCESSING_MS));

  await updateCoiJobStatus(data.coiJobId, {
    status: JobStatus.READY_FOR_REVIEW,
  });
}

export async function markJobProcessing(coiJobId: string): Promise<void> {
  await updateCoiJobStatus(coiJobId, { status: JobStatus.PROCESSING });
}

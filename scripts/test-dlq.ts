import { getEnv, isDlqTestMode } from "@/lib/env";
import { enqueueProcessCoiJob } from "@/lib/queue/coi-queue";
import { prisma } from "@/lib/prisma";

async function main() {
  const env = getEnv();

  if (!isDlqTestMode()) {
    console.error("Set WORKER_FORCE_FAIL=true in .env and restart worker + dev server.");
    process.exit(1);
  }

  console.log("Queue:", env.BULLMQ_COI_QUEUE);
  console.log("DLQ:", env.BULLMQ_COI_DLQ);
  console.log("Ensure npm run worker is running in another terminal.\n");

  const version = await prisma.coiVersion.findFirst({
    orderBy: { createdAt: "desc" },
    include: { coiDocument: true },
  });

  if (!version) {
    console.error("Upload a COI first, then run this script.");
    process.exit(1);
  }

  const job = await prisma.coiJob.create({
    data: {
      coiVersionId: version.id,
      coiDocumentId: version.coiDocumentId,
      queueName: env.BULLMQ_COI_QUEUE,
      status: "QUEUED",
    },
  });

  await enqueueProcessCoiJob(job.id, version.coiDocumentId, version.id);
  console.log(`Enqueued test job ${job.id} (forceFail=true)\n`);

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const updated = await prisma.coiJob.findUnique({ where: { id: job.id } });
    console.log(
      `  ${i + 1}s — status: ${updated?.status}, attempts: ${updated?.attempts ?? 0}`
    );
    if (updated?.status === "DLQ") {
      console.log("\nDLQ test PASSED");
      process.exit(0);
    }
  }

  console.error("\nDLQ test FAILED — job never reached DLQ status.");
  console.error("Check worker logs for [worker-<pid>] lines. If missing, another worker may be stealing jobs.");
  process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/**
 * Phase 3 setup: backfill Sender + CoiVersion for existing CoiDocuments,
 * link CoiJobs to versions, and seed default checklist items.
 *
 * Run: npm run db:phase3
 */
import { CoiStatus, PrismaClient } from "@prisma/client";
import { DEFAULT_CHECKLIST_ITEMS } from "../lib/constants/checklist-categories";

const prisma = new PrismaClient();

async function backfillVersions(): Promise<number> {
  const documents = await prisma.coiDocument.findMany({
    include: { version: true, jobs: true },
    orderBy: { createdAt: "asc" },
  });

  let created = 0;

  for (const document of documents) {
    if (document.version) {
      for (const job of document.jobs) {
        if (!job.coiVersionId) {
          await prisma.coiJob.update({
            where: { id: job.id },
            data: { coiVersionId: document.version!.id },
          });
        }
      }
      continue;
    }

    const legacy = document as typeof document & {
      status?: CoiStatus;
      notes?: string | null;
    };

    const email =
      document.senderEmail?.trim().toLowerCase() ||
      `legacy+${document.id}@local.dev`;

    const sender = await prisma.sender.upsert({
      where: { email },
      create: { email },
      update: {},
    });

    const existingCount = await prisma.coiVersion.count({
      where: { senderId: sender.id },
    });

    const version = await prisma.coiVersion.create({
      data: {
        senderId: sender.id,
        versionNumber: existingCount + 1,
        coiDocumentId: document.id,
        status: legacy.status ?? CoiStatus.PENDING_REVIEW,
        notes: legacy.notes ?? null,
      },
    });

    for (const job of document.jobs) {
      await prisma.coiJob.update({
        where: { id: job.id },
        data: { coiVersionId: version.id },
      });
    }

    created += 1;
  }

  return created;
}

async function seedChecklist(): Promise<number> {
  const count = await prisma.checklistItem.count();
  if (count > 0) {
    return 0;
  }

  await prisma.checklistItem.createMany({ data: DEFAULT_CHECKLIST_ITEMS });
  return DEFAULT_CHECKLIST_ITEMS.length;
}

async function main(): Promise<void> {
  console.log("Phase 3 setup starting...");

  const versionsCreated = await backfillVersions();
  console.log(`Backfilled ${versionsCreated} CoiVersion record(s).`);

  const checklistSeeded = await seedChecklist();
  if (checklistSeeded > 0) {
    console.log(`Seeded ${checklistSeeded} default checklist item(s).`);
  } else {
    console.log("Checklist already populated — skipped seed.");
  }

  console.log("Phase 3 setup complete.");
}

main()
  .catch((error) => {
    console.error("Phase 3 setup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

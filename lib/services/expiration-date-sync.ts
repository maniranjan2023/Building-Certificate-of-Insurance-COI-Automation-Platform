import { CoiStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getExpirationDate } from "@/lib/utils/coi-dates";

/** Sync denormalized expirationDate from JSON for reminder-eligible COIs missing the column. */
export async function backfillExpirationDatesForReminderScan(): Promise<number> {
  const candidates = await prisma.coiVersion.findMany({
    where: {
      status: { in: [CoiStatus.ACCEPTED, CoiStatus.EXPIRING_SOON] },
      expirationDate: null,
    },
    select: {
      id: true,
      extractedFields: true,
    },
  });

  const withExpiry = candidates.filter(
    (version) => version.extractedFields != null
  );

  if (!withExpiry.length) {
    return 0;
  }

  const updates = withExpiry
    .map((version) => ({
      id: version.id,
      expirationDate: getExpirationDate(version.extractedFields),
    }))
    .filter((entry): entry is { id: string; expirationDate: Date } =>
      Boolean(entry.expirationDate)
    );

  if (!updates.length) {
    return 0;
  }

  await prisma.$transaction(
    updates.map((entry) =>
      prisma.coiVersion.update({
        where: { id: entry.id },
        data: { expirationDate: entry.expirationDate },
      })
    )
  );

  return updates.length;
}

export function expirationDateFromExtraction(
  extractedFields: unknown
): Date | undefined {
  const parsed = getExpirationDate(extractedFields);
  return parsed ?? undefined;
}

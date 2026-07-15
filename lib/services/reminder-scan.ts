import { CoiStatus, JobStatus, JobType } from "@prisma/client";
import { getReminderDaysBefore } from "@/lib/env";
import { enqueueSendReminderJobsBulk } from "@/lib/services/jobs";
import { INNGEST_REMINDER_QUEUE } from "@/lib/jobs/types";
import { backfillExpirationDatesForReminderScan } from "@/lib/services/expiration-date-sync";
import { prisma } from "@/lib/prisma";
import {
  addDays,
  daysUntilExpiry,
  resolveExpirationDate,
  startOfDay,
} from "@/lib/utils/coi-dates";

export interface ExpiryScanResult {
  scanned: number;
  statusUpdates: number;
  remindersEnqueued: number;
  skippedAlreadySent: number;
  skippedNoEmail: number;
  skippedNoExpiry: number;
  expirationDatesBackfilled: number;
}

type ScanRow = {
  id: string;
  coiDocumentId: string;
  status: CoiStatus;
  expirationDate: Date | null;
  extractedFields: unknown;
  coiDocument: { senderEmail: string | null };
  sender: { email: string };
};

function resolveRecipientEmail(version: ScanRow): string | null {
  const email = version.coiDocument.senderEmail ?? version.sender.email;
  return email?.trim() ? email.trim().toLowerCase() : null;
}

function reminderLogKey(coiDocumentId: string, daysBefore: number): string {
  return `${coiDocumentId}:${daysBefore}`;
}

export async function runExpiryReminderScan(): Promise<ExpiryScanResult> {
  const reminderDays = getReminderDaysBefore();
  const today = startOfDay(new Date());
  const windowEnd = addDays(today, 30);

  const expirationDatesBackfilled = await backfillExpirationDatesForReminderScan();

  const versions = await prisma.coiVersion.findMany({
    where: {
      status: { in: [CoiStatus.ACCEPTED, CoiStatus.EXPIRING_SOON] },
      OR: [
        {
          expirationDate: { not: null, lte: windowEnd },
        },
        {
          status: CoiStatus.EXPIRING_SOON,
          expirationDate: { not: null, gt: windowEnd },
        },
      ],
    },
    select: {
      id: true,
      coiDocumentId: true,
      status: true,
      expirationDate: true,
      extractedFields: true,
      coiDocument: {
        select: { senderEmail: true },
      },
      sender: {
        select: { email: true },
      },
    },
  });

  const result: ExpiryScanResult = {
    scanned: versions.length,
    statusUpdates: 0,
    remindersEnqueued: 0,
    skippedAlreadySent: 0,
    skippedNoEmail: 0,
    skippedNoExpiry: 0,
    expirationDatesBackfilled,
  };

  if (!versions.length) {
    return result;
  }

  const documentIds = [...new Set(versions.map((version) => version.coiDocumentId))];
  const existingLogs = await prisma.reminderLog.findMany({
    where: { coiDocumentId: { in: documentIds } },
    select: { coiDocumentId: true, daysBefore: true },
  });
  const sentReminderKeys = new Set(
    existingLogs.map((log) => reminderLogKey(log.coiDocumentId, log.daysBefore))
  );

  const toExpire: string[] = [];
  const toExpiringSoon: string[] = [];
  const toAccepted: string[] = [];
  const toEnqueue: Array<{
    coiVersionId: string;
    coiDocumentId: string;
    daysBefore: number;
    toEmail: string;
  }> = [];

  for (const version of versions as ScanRow[]) {
    const expiration = resolveExpirationDate(version);
    if (!expiration) {
      result.skippedNoExpiry++;
      continue;
    }

    const daysLeft = daysUntilExpiry(expiration, today);
    let nextStatus = version.status;

    if (daysLeft <= 0) {
      nextStatus = CoiStatus.EXPIRED;
    } else if (daysLeft <= 30) {
      nextStatus = CoiStatus.EXPIRING_SOON;
    } else if (version.status === CoiStatus.EXPIRING_SOON) {
      nextStatus = CoiStatus.ACCEPTED;
    }

    if (nextStatus !== version.status) {
      if (nextStatus === CoiStatus.EXPIRED) {
        toExpire.push(version.id);
      } else if (nextStatus === CoiStatus.EXPIRING_SOON) {
        toExpiringSoon.push(version.id);
      } else if (nextStatus === CoiStatus.ACCEPTED) {
        toAccepted.push(version.id);
      }
    }

    if (daysLeft <= 0) {
      continue;
    }

    const matchingDay = reminderDays.find((daysBefore) => daysLeft === daysBefore);
    if (!matchingDay) {
      continue;
    }

    if (sentReminderKeys.has(reminderLogKey(version.coiDocumentId, matchingDay))) {
      result.skippedAlreadySent++;
      continue;
    }

    const toEmail = resolveRecipientEmail(version);
    if (!toEmail) {
      result.skippedNoEmail++;
      continue;
    }

    toEnqueue.push({
      coiVersionId: version.id,
      coiDocumentId: version.coiDocumentId,
      daysBefore: matchingDay,
      toEmail,
    });
  }

  let expiredCount = 0;
  let expiringSoonCount = 0;
  let acceptedCount = 0;

  if (toExpire.length) {
    expiredCount = (
      await prisma.coiVersion.updateMany({
        where: { id: { in: toExpire } },
        data: { status: CoiStatus.EXPIRED },
      })
    ).count;
  }

  if (toExpiringSoon.length) {
    expiringSoonCount = (
      await prisma.coiVersion.updateMany({
        where: { id: { in: toExpiringSoon } },
        data: { status: CoiStatus.EXPIRING_SOON },
      })
    ).count;
  }

  if (toAccepted.length) {
    acceptedCount = (
      await prisma.coiVersion.updateMany({
        where: { id: { in: toAccepted } },
        data: { status: CoiStatus.ACCEPTED },
      })
    ).count;
  }

  result.statusUpdates = expiredCount + expiringSoonCount + acceptedCount;

  if (!toEnqueue.length) {
    return result;
  }

  const createdJobs = await prisma.$transaction(
    toEnqueue.map((item) =>
      prisma.coiJob.create({
        data: {
          coiVersionId: item.coiVersionId,
          coiDocumentId: item.coiDocumentId,
          queueName: INNGEST_REMINDER_QUEUE,
          type: JobType.SEND_REMINDER,
          status: JobStatus.QUEUED,
        },
        select: {
          id: true,
          coiVersionId: true,
          coiDocumentId: true,
        },
      })
    )
  );

  const bullmqJobIds = await enqueueSendReminderJobsBulk(
    createdJobs.map((job, index) => ({
      coiJobId: job.id,
      coiVersionId: job.coiVersionId!,
      coiDocumentId: job.coiDocumentId,
      daysBefore: toEnqueue[index].daysBefore,
      toEmail: toEnqueue[index].toEmail,
    }))
  );

  await prisma.$transaction(
    createdJobs.map((job, index) =>
      prisma.coiJob.update({
        where: { id: job.id },
        data: { bullmqJobId: bullmqJobIds[index] },
      })
    )
  );

  result.remindersEnqueued = toEnqueue.length;
  return result;
}

import { CoiStatus } from "@prisma/client";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  daysUntilExpiry,
  resolveExpirationDate,
  startOfDay,
} from "@/lib/utils/coi-dates";

export interface PlatformMetrics {
  generatedAt: string;
  portfolio: {
    totalSubmissions: number;
    uniqueTenants: number;
    activeCois: number;
    acceptedActive: number;
    expiringSoon: number;
    expired: number;
    pendingReview: number;
    rejected: number;
  };
  compliance: {
    compliancePercent: number;
    definition: string;
  };
  automation: {
    automationPercent: number;
    aiProcessedCount: number;
    totalWithVersions: number;
    definition: string;
  };
  turnaround: {
    avgAgentResponseHours: number | null;
    avgComplianceResolutionDays: number | null;
    samplesAgentResponse: number;
    samplesComplianceResolution: number;
  };
  roi: {
    manualReviewMinutes: number;
    hourlyRateUsd: number;
    platformCostAnnualUsd: number;
    hoursSaved: number;
    workingDaysSaved: number;
    costSavingsUsd: number;
    roiPercent: number;
  };
  reminders: {
    totalSent: number;
    lastSentAt: string | null;
  };
}

function hoursBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

function daysBetweenTimestamps(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
}

export async function computePlatformMetrics(): Promise<PlatformMetrics> {
  const env = getEnv();
  const today = startOfDay(new Date());

  const versions = await prisma.coiVersion.findMany({
    select: {
      id: true,
      senderId: true,
      status: true,
      expirationDate: true,
      extractedFields: true,
      createdAt: true,
      updatedAt: true,
      coiDocument: { select: { createdAt: true } },
      aiRuns: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: { completedAt: true },
      },
    },
  });

  const tenantIds = new Set<string>();
  let activeCois = 0;
  let acceptedActive = 0;
  let expiringSoon = 0;
  let expired = 0;
  let pendingReview = 0;
  let rejected = 0;

  const agentResponseHours: number[] = [];
  const resolutionDays: number[] = [];
  let aiProcessedCount = 0;

  for (const version of versions) {
    tenantIds.add(version.senderId);

    const expiration = resolveExpirationDate(version);
    const daysLeft = expiration ? daysUntilExpiry(expiration, today) : null;
    const isActive =
      (version.status === CoiStatus.ACCEPTED ||
        version.status === CoiStatus.EXPIRING_SOON) &&
      (daysLeft == null || daysLeft > 0);

    if (isActive) {
      activeCois++;
      acceptedActive++;
    }

    if (version.status === CoiStatus.EXPIRING_SOON && isActive) {
      expiringSoon++;
    } else if (
      version.status === CoiStatus.EXPIRED ||
      ((version.status === CoiStatus.ACCEPTED ||
        version.status === CoiStatus.EXPIRING_SOON) &&
        daysLeft != null &&
        daysLeft <= 0)
    ) {
      expired++;
    } else if (version.status === CoiStatus.PENDING_REVIEW) {
      pendingReview++;
    } else if (version.status === CoiStatus.REJECTED) {
      rejected++;
    }

    const completedRun = version.aiRuns[0];
    if (completedRun?.completedAt) {
      aiProcessedCount++;
      agentResponseHours.push(
        hoursBetween(version.coiDocument.createdAt, completedRun.completedAt)
      );
    }

    if (version.status === CoiStatus.ACCEPTED) {
      resolutionDays.push(
        daysBetweenTimestamps(version.coiDocument.createdAt, version.updatedAt)
      );
    }
  }

  const compliancePercent =
    activeCois > 0 ? Math.round((acceptedActive / activeCois) * 1000) / 10 : 0;

  const totalWithVersions = versions.length;
  const automationPercent =
    totalWithVersions > 0
      ? Math.round((aiProcessedCount / totalWithVersions) * 1000) / 10
      : 0;

  const hoursSaved = Math.round((aiProcessedCount * env.MANUAL_REVIEW_MINUTES) / 60 * 10) / 10;
  const workingDaysSaved = Math.round((hoursSaved / 8) * 10) / 10;
  const costSavingsUsd = Math.round(hoursSaved * env.HOURLY_RATE_USD);
  const roiPercent =
    env.PLATFORM_COST_ANNUAL_USD > 0
      ? Math.round((costSavingsUsd / env.PLATFORM_COST_ANNUAL_USD) * 1000) / 10
      : 0;

  const reminderAgg = await prisma.reminderLog.aggregate({
    _count: { _all: true },
    _max: { sentAt: true },
  });

  const avg = (values: number[]) =>
    values.length
      ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
      : null;

  return {
    generatedAt: new Date().toISOString(),
    portfolio: {
      totalSubmissions: versions.length,
      uniqueTenants: tenantIds.size,
      activeCois,
      acceptedActive,
      expiringSoon,
      expired,
      pendingReview,
      rejected,
    },
    compliance: {
      compliancePercent,
      definition: "Accepted active COIs ÷ total active COIs (accepted, not expired)",
    },
    automation: {
      automationPercent,
      aiProcessedCount,
      totalWithVersions,
      definition: "COIs with a completed AI pipeline run ÷ total versioned COIs",
    },
    turnaround: {
      avgAgentResponseHours: avg(agentResponseHours),
      avgComplianceResolutionDays: avg(resolutionDays),
      samplesAgentResponse: agentResponseHours.length,
      samplesComplianceResolution: resolutionDays.length,
    },
    roi: {
      manualReviewMinutes: env.MANUAL_REVIEW_MINUTES,
      hourlyRateUsd: env.HOURLY_RATE_USD,
      platformCostAnnualUsd: env.PLATFORM_COST_ANNUAL_USD,
      hoursSaved,
      workingDaysSaved,
      costSavingsUsd,
      roiPercent,
    },
    reminders: {
      totalSent: reminderAgg._count._all,
      lastSentAt: reminderAgg._max.sentAt?.toISOString() ?? null,
    },
  };
}

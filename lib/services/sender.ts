import { prisma } from "@/lib/prisma";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findSenderByEmail(email: string) {
  return prisma.sender.findUnique({
    where: { email: normalizeEmail(email) },
  });
}

export async function findOrCreateSender(email: string, displayName?: string | null) {
  const normalized = normalizeEmail(email);
  return prisma.sender.upsert({
    where: { email: normalized },
    create: {
      email: normalized,
      displayName: displayName?.trim() || null,
    },
    update: displayName?.trim()
      ? { displayName: displayName.trim() }
      : {},
  });
}

export async function listSenders() {
  return prisma.sender.findMany({
    orderBy: { email: "asc" },
    include: {
      _count: { select: { versions: true } },
    },
  });
}

export function resolveSenderEmailForDashboard(
  senderEmail: string | null | undefined,
  fallbackId: string
): string {
  const trimmed = senderEmail?.trim().toLowerCase();
  if (trimmed && trimmed.includes("@")) {
    return trimmed;
  }
  return `dashboard+${fallbackId}@local.dev`;
}

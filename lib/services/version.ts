import { CoiStatus, type CoiVersion, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findOrCreateSender } from "@/lib/services/sender";

export class VersionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VersionValidationError";
  }
}

export type CoiVersionWithRelations = Prisma.CoiVersionGetPayload<{
  include: {
    sender: true;
    coiDocument: true;
    jobs: { orderBy: { createdAt: "desc" }; take: 1 };
  };
}>;

export async function getNextVersionNumber(senderId: string): Promise<number> {
  const latest = await prisma.coiVersion.findFirst({
    where: { senderId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });
  return (latest?.versionNumber ?? 0) + 1;
}

export async function createCoiVersionForDocument(
  coiDocumentId: string,
  senderEmail: string,
  options?: { notes?: string | null; displayName?: string | null }
): Promise<CoiVersion> {
  const sender = await findOrCreateSender(senderEmail, options?.displayName);
  const versionNumber = await getNextVersionNumber(sender.id);

  return prisma.coiVersion.create({
    data: {
      senderId: sender.id,
      versionNumber,
      coiDocumentId,
      status: CoiStatus.PENDING_REVIEW,
      notes: options?.notes ?? null,
    },
  });
}

export async function listVersionsForDocument(coiDocumentId: string) {
  const version = await prisma.coiVersion.findUnique({
    where: { coiDocumentId },
    include: { sender: true },
  });

  if (!version) {
    return [];
  }

  return prisma.coiVersion.findMany({
    where: { senderId: version.senderId },
    include: {
      sender: true,
      coiDocument: true,
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { versionNumber: "asc" },
  });
}

export async function listVersionsForSender(senderId: string) {
  return prisma.coiVersion.findMany({
    where: { senderId },
    include: {
      sender: true,
      coiDocument: true,
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { versionNumber: "asc" },
  });
}

export async function getVersionByDocumentId(coiDocumentId: string) {
  return prisma.coiVersion.findUnique({
    where: { coiDocumentId },
    include: {
      sender: true,
      coiDocument: true,
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function getVersionById(versionId: string) {
  return prisma.coiVersion.findUnique({
    where: { id: versionId },
    include: {
      sender: true,
      coiDocument: true,
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function updateVersionStatus(
  versionId: string,
  status: CoiStatus,
  rejectionReason?: string | null
) {
  if (status === CoiStatus.ACCEPTED || status === CoiStatus.REJECTED) {
    throw new VersionValidationError(
      "ACCEPTED and REJECTED statuses must use the dedicated accept/reject routes."
    );
  }

  return prisma.coiVersion.update({
    where: { id: versionId },
    data: {
      status,
      rejectionReason: null,
    },
    include: {
      sender: true,
      coiDocument: true,
    },
  });
}

export async function listAllVersionsWithLatestJob(): Promise<
  CoiVersionWithRelations[]
> {
  const versions = await prisma.coiVersion.findMany({
    include: {
      sender: true,
      coiDocument: true,
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return versions.map((version) => ({
    ...version,
    jobs: version.jobs,
  }));
}

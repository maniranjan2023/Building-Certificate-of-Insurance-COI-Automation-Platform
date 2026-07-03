import {
  CoiStatus,
  IntakeSource,
  type CoiDocument,
  type CoiJob,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { uploadCoiBuffer, uploadCoiDocument } from "@/lib/services/cloudinary";
import { createProcessCoiJob } from "@/lib/services/jobs";

export type CoiDocumentWithLatestJob = CoiDocument & {
  latestJob: CoiJob | null;
};

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export class CoiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoiValidationError";
  }
}

export function validateCoiFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new CoiValidationError(
      "Invalid file type. Upload a PDF or image (JPEG, PNG, WebP)."
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new CoiValidationError("File exceeds the 10 MB size limit.");
  }

  if (file.size === 0) {
    throw new CoiValidationError("File is empty.");
  }
}

export function validateCoiBuffer(
  buffer: Buffer,
  mimeType: string
): void {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new CoiValidationError(
      "Invalid file type. Upload a PDF or image (JPEG, PNG, WebP)."
    );
  }

  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new CoiValidationError("File exceeds the 10 MB size limit.");
  }

  if (buffer.byteLength === 0) {
    throw new CoiValidationError("File is empty.");
  }
}

interface CreateCoiInput {
  fileName: string;
  mimeType: string;
  intakeSource: IntakeSource;
  senderEmail?: string | null;
}

async function createCoiRecord(
  input: CreateCoiInput,
  upload: { url: string; publicId: string; bytes: number }
): Promise<CoiDocument> {
  return prisma.coiDocument.create({
    data: {
      fileName: input.fileName,
      cloudinaryUrl: upload.url,
      cloudinaryPublicId: upload.publicId,
      mimeType: input.mimeType,
      fileSizeBytes: upload.bytes,
      status: CoiStatus.PENDING_REVIEW,
      intakeSource: input.intakeSource,
      senderEmail: input.senderEmail ?? null,
    },
  });
}

export async function createCoiFromUpload(file: File): Promise<CoiDocument> {
  validateCoiFile(file);
  const upload = await uploadCoiDocument(file);
  return createCoiRecord(
    {
      fileName: file.name,
      mimeType: file.type,
      intakeSource: IntakeSource.DASHBOARD,
    },
    upload
  );
}

export async function createCoiFromUploadWithJob(file: File) {
  const document = await createCoiFromUpload(file);
  const job = await createProcessCoiJob(document.id);
  return { document, job };
}

export async function createCoiFromBufferWithJob(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  senderEmail?: string | null
) {
  validateCoiBuffer(buffer, mimeType);
  const upload = await uploadCoiBuffer(buffer, fileName, mimeType);
  const document = await createCoiRecord(
    {
      fileName,
      mimeType,
      intakeSource: IntakeSource.EMAIL,
      senderEmail,
    },
    upload
  );
  const job = await createProcessCoiJob(document.id);
  return { document, job };
}

export async function listCoiDocuments(): Promise<CoiDocument[]> {
  return prisma.coiDocument.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function listCoiDocumentsWithLatestJob(): Promise<
  CoiDocumentWithLatestJob[]
> {
  const documents = await prisma.coiDocument.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return documents.map(({ jobs, ...document }) => ({
    ...document,
    latestJob: jobs[0] ?? null,
  }));
}

export async function getCoiDocumentById(
  id: string
): Promise<CoiDocument | null> {
  return prisma.coiDocument.findUnique({ where: { id } });
}

export async function getCoiDocumentByIdWithLatestJob(
  id: string
): Promise<CoiDocumentWithLatestJob | null> {
  const document = await prisma.coiDocument.findUnique({
    where: { id },
    include: {
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!document) {
    return null;
  }

  const { jobs, ...rest } = document;
  return { ...rest, latestJob: jobs[0] ?? null };
}

export const COI_STATUS_LABELS: Record<CoiStatus, string> = {
  PENDING_REVIEW: "Pending Review",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRING_SOON: "Expiring Soon",
  EXPIRED: "Expired",
};

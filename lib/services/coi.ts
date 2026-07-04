import {
  IntakeSource,
  type CoiDocument,
  type CoiJob,
  type CoiVersion,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { uploadCoiBuffer, uploadCoiDocument } from "@/lib/services/cloudinary";
import { createProcessCoiJob } from "@/lib/services/jobs";
import { findOrCreateSender } from "@/lib/services/sender";
import {
  createCoiVersionForDocument,
  getVersionByDocumentId,
  listAllVersionsWithLatestJob,
  type CoiVersionWithRelations,
} from "@/lib/services/version";

export type CoiSubmissionRow = CoiVersionWithRelations & {
  latestJob: CoiJob | null;
};

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

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

export function validateCoiBuffer(buffer: Buffer, mimeType: string): void {
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

function validateSenderEmail(email: string | null | undefined): string {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    throw new CoiValidationError(
      "Tenant email is required for version tracking (e.g. tenant@example.com)."
    );
  }
  return trimmed;
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
      intakeSource: input.intakeSource,
      senderEmail: input.senderEmail ?? null,
    },
  });
}

async function createSubmissionWithJob(
  document: CoiDocument,
  senderEmail: string
): Promise<{ document: CoiDocument; version: CoiVersion; job: CoiJob }> {
  const version = await createCoiVersionForDocument(document.id, senderEmail);
  const job = await createProcessCoiJob(version.id, document.id);
  return { document, version, job };
}

export async function createCoiFromUploadWithJob(
  file: File,
  senderEmail?: string | null
) {
  validateCoiFile(file);
  const email = validateSenderEmail(senderEmail);
  const upload = await uploadCoiDocument(file);
  const document = await createCoiRecord(
    {
      fileName: file.name,
      mimeType: file.type,
      intakeSource: IntakeSource.DASHBOARD,
      senderEmail: email,
    },
    upload
  );

  return createSubmissionWithJob(document, email);
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
      senderEmail: email,
    },
    upload
  );

  const email = senderEmail?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new CoiValidationError(
      "Email intake requires a valid sender email on the message."
    );
  }

  await findOrCreateSender(email);
  return createSubmissionWithJob(document, email);
}

export async function createResubmissionWithJob(
  file: File,
  senderEmail: string
) {
  return createCoiFromUploadWithJob(file, senderEmail);
}

export async function listCoiDocuments(): Promise<CoiDocument[]> {
  return prisma.coiDocument.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function listCoiSubmissions(): Promise<CoiSubmissionRow[]> {
  const versions = await listAllVersionsWithLatestJob();
  return versions.map((version) => ({
    ...version,
    latestJob: version.jobs[0] ?? null,
  }));
}

/** @deprecated Use listCoiSubmissions — kept for compatibility */
export async function listCoiDocumentsWithLatestJob(): Promise<CoiSubmissionRow[]> {
  return listCoiSubmissions();
}

export async function getCoiDocumentById(
  id: string
): Promise<CoiDocument | null> {
  return prisma.coiDocument.findUnique({ where: { id } });
}

export async function getCoiDocumentByIdWithLatestJob(id: string) {
  const version = await getVersionByDocumentId(id);
  if (!version) {
    const document = await getCoiDocumentById(id);
    if (!document) {
      return null;
    }
    return {
      ...document,
      version: null,
      sender: null,
      latestJob: null as CoiJob | null,
      status: null,
      senderEmail: null,
    };
  }

  return {
    ...version.coiDocument,
    version,
    sender: version.sender,
    latestJob: version.jobs[0] ?? null,
    status: version.status,
    senderEmail: version.sender.email,
  };
}

export { COI_STATUS_LABELS } from "@/lib/services/version-labels";

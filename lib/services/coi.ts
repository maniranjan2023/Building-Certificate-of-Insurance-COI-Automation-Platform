import { CoiStatus, type CoiDocument } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { uploadCoiDocument } from "@/lib/services/cloudinary";

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

export async function createCoiFromUpload(file: File): Promise<CoiDocument> {
  validateCoiFile(file);

  const upload = await uploadCoiDocument(file);

  return prisma.coiDocument.create({
    data: {
      fileName: file.name,
      cloudinaryUrl: upload.url,
      cloudinaryPublicId: upload.publicId,
      mimeType: file.type,
      fileSizeBytes: upload.bytes,
      status: CoiStatus.PENDING_REVIEW,
    },
  });
}

export async function listCoiDocuments(): Promise<CoiDocument[]> {
  return prisma.coiDocument.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getCoiDocumentById(id: string): Promise<CoiDocument | null> {
  return prisma.coiDocument.findUnique({ where: { id } });
}

export const COI_STATUS_LABELS: Record<CoiStatus, string> = {
  PENDING_REVIEW: "Pending Review",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRING_SOON: "Expiring Soon",
  EXPIRED: "Expired",
};

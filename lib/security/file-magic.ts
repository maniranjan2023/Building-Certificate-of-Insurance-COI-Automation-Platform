import { CoiValidationError } from "@/lib/services/coi";

const PDF_MAGIC = Buffer.from("%PDF", "ascii");
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP_RIFF = Buffer.from("RIFF", "ascii");
const WEBP_MARKER = Buffer.from("WEBP", "ascii");

function bufferStartsWith(buffer: Buffer, magic: Buffer): boolean {
  if (buffer.length < magic.length) {
    return false;
  }
  return buffer.subarray(0, magic.length).equals(magic);
}

function isWebp(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    bufferStartsWith(buffer, WEBP_RIFF) &&
    buffer.subarray(8, 12).equals(WEBP_MARKER)
  );
}

export function detectBufferMimeType(buffer: Buffer): string | null {
  if (bufferStartsWith(buffer, PDF_MAGIC)) {
    return "application/pdf";
  }
  if (bufferStartsWith(buffer, JPEG_MAGIC)) {
    return "image/jpeg";
  }
  if (bufferStartsWith(buffer, PNG_MAGIC)) {
    return "image/png";
  }
  if (isWebp(buffer)) {
    return "image/webp";
  }
  return null;
}

export function assertBufferMatchesMimeType(buffer: Buffer, mimeType: string): void {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new CoiValidationError("File is empty or unreadable.");
  }
  if (!mimeType || typeof mimeType !== "string") {
    throw new CoiValidationError("File MIME type is missing.");
  }

  const detected = detectBufferMimeType(buffer);
  if (!detected) {
    throw new CoiValidationError(
      "File content does not match a supported COI format (PDF or image)."
    );
  }
  if (detected !== mimeType) {
    throw new CoiValidationError(
      `File content (${detected}) does not match declared type (${mimeType}).`
    );
  }
}

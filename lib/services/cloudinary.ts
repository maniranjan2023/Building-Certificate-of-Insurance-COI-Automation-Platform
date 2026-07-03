import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "@/lib/env";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  bytes: number;
}

export class CloudinaryUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CloudinaryUploadError";
  }
}

function configureCloudinary(): void {
  const env = getEnv();
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function toUploadError(error: unknown): CloudinaryUploadError {
  const httpCode =
    error && typeof error === "object" && "http_code" in error
      ? (error as { http_code?: number }).http_code
      : undefined;

  const nestedMessage =
    error &&
    typeof error === "object" &&
    "error" in error &&
    (error as { error?: { message?: string } }).error?.message;

  if (httpCode === 401) {
    return new CloudinaryUploadError(
      "Cloudinary authentication failed. Verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env (API secret is different from API key)."
    );
  }

  if (httpCode === 403) {
    return new CloudinaryUploadError(
      String(nestedMessage?? "").includes("permissions")
        ? "Cloudinary API key is missing upload permission. In Cloudinary → Settings → API Keys, use the Root key or create a key with Upload enabled, then update .env and restart the dev server."
        : "Cloudinary rejected the upload (403). Check that your API key has Upload permission and matches CLOUDINARY_CLOUD_NAME."
    );
  }

  if (error instanceof Error && error.message) {
    return new CloudinaryUploadError(error.message);
  }

  return new CloudinaryUploadError("Cloudinary upload failed.");
}

export async function uploadCoiDocument(
  file: File,
  folder?: string
): Promise<CloudinaryUploadResult> {
  const arrayBuffer = await file.arrayBuffer();
  return uploadCoiBuffer(Buffer.from(arrayBuffer), file.name, file.type, folder);
}

export async function uploadCoiBuffer(
  buffer: Buffer,
  _fileName: string,
  _mimeType: string,
  folder?: string
): Promise<CloudinaryUploadResult> {
  configureCloudinary();
  const env = getEnv();
  const uploadFolder = folder ?? env.CLOUDINARY_FOLDER;

  const result = await new Promise<{
    secure_url: string;
    public_id: string;
    bytes: number;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: uploadFolder,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(toUploadError(error ?? new Error("Cloudinary upload failed")));
          return;
        }
        resolve({
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          bytes: uploadResult.bytes,
        });
      }
    );

    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    bytes: result.bytes,
  };
}

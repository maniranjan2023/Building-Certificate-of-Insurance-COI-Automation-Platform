import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "@/lib/env";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  bytes: number;
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

export async function uploadCoiDocument(
  file: File,
  folder?: string
): Promise<CloudinaryUploadResult> {
  configureCloudinary();
  const env = getEnv();

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

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
          reject(error ?? new Error("Cloudinary upload failed"));
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

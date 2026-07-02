import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email"),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_PASSWORD_HASH: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  CLOUDINARY_FOLDER: z.string().default("coi-documents"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${message}`);
  }

  if (!parsed.data.ADMIN_PASSWORD && !parsed.data.ADMIN_PASSWORD_HASH) {
    throw new Error(
      "Either ADMIN_PASSWORD or ADMIN_PASSWORD_HASH must be set for admin login."
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function tryGetEnv(): Env | null {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    return null;
  }
  if (!parsed.data.ADMIN_PASSWORD && !parsed.data.ADMIN_PASSWORD_HASH) {
    return null;
  }
  return parsed.data;
}

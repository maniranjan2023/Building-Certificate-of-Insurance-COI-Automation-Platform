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

  REDIS_URL: z.string().optional(),

  BULLMQ_COI_QUEUE: z.string().default("coi-jobs"),

  BULLMQ_COI_DLQ: z.string().default("coi-jobs-dlq"),

  BULLMQ_REMINDER_QUEUE: z.string().default("reminder-jobs"),

  BULLMQ_REMINDER_DLQ: z.string().default("reminder-jobs-dlq"),

  JOB_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(5),

  JOB_BACKOFF_DELAY_MS: z.coerce.number().int().min(100).default(5000),

  AGENTMAIL_API_KEY: z.string().optional(),

  INBOX_ID: z.string().default("maniranjan@agentmail.to"),

  WORKER_FORCE_FAIL: z.string().optional(),

});



export type Env = z.infer<typeof envSchema>;



let cachedEnv: Env | null = null;



function parseEnv(): Env {

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



  if (parsed.data.CLOUDINARY_API_KEY === parsed.data.CLOUDINARY_API_SECRET) {

    throw new Error(

      "CLOUDINARY_API_SECRET must not equal CLOUDINARY_API_KEY. Copy the API Secret from the Cloudinary dashboard (Settings → API Keys)."

    );

  }



  return parsed.data;

}



export function getEnv(): Env {

  if (!cachedEnv) {

    cachedEnv = parseEnv();

  }

  return cachedEnv;

}



export function tryGetEnv(): Env | null {

  try {

    return parseEnv();

  } catch {

    return null;

  }

}



export function getRedisUrl(): string {

  const url = getEnv().REDIS_URL;

  if (!url) {

    throw new Error("REDIS_URL is required for queue operations.");

  }

  return url;

}



export function getAgentMailApiKey(): string {

  const key = getEnv().AGENTMAIL_API_KEY;

  if (!key) {

    throw new Error("AGENTMAIL_API_KEY is required for email intake.");

  }

  return key;
}

export function isDlqTestMode(): boolean {
  return process.env.WORKER_FORCE_FAIL?.trim().toLowerCase() === "true";
}

export function resetEnvCache(): void {
  cachedEnv = null;
}


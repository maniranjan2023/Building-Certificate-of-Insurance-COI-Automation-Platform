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

  /** Shared secret for AgentMail webhook authentication (Bearer or X-AgentMail-Webhook-Secret). */
  AGENTMAIL_WEBHOOK_SECRET: z.string().optional(),

  /** Bearer token for unauthenticated health probes (optional in development). */
  HEALTH_CHECK_SECRET: z.string().optional(),

  INBOX_ID: z.string().default("maniranjan@agentmail.to"),

  WORKER_FORCE_FAIL: z.string().optional(),

  // Phase 4 — Groq (OpenAI SDK compatible)
  GROQ_API_KEY: z.string().optional(),
  GROQ_BASE_URL: z.string().url().default("https://api.groq.com/openai/v1"),
  GROQ_MODEL_PRIMARY: z.string().default("llama-3.3-70b-versatile"),
  GROQ_MODEL_FALLBACK_1: z.string().default("llama-3.1-8b-instant"),
  GROQ_MODEL_FALLBACK_2: z.string().default("mixtral-8x7b-32768"),
  GROQ_GUARDRAIL_MODEL: z.string().default("llama-3.1-8b-instant"),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).default(2),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).default(60000),

  // Phase 4 — LlamaParse OCR
  LLAMA_CLOUD_API_KEY: z.string().optional(),
  LLAMAPARSE_TIER: z.string().default("agentic"),

  // Phase 4 — Pydantic Logfire (https://pydantic.dev/docs/logfire/integrations/llms/openai/)
  LOGFIRE_TOKEN: z.string().optional(),
  LOGFIRE_SERVICE_NAME: z.string().default("coi-email-agent"),
  LOGFIRE_ENVIRONMENT: z.string().default("development"),
  LOGFIRE_SEND_TO_LOGFIRE: z
    .enum(["true", "false", "if-token-present"])
    .default("if-token-present"),
  /** Mirror spans/logs to terminal (very noisy with auto-instrumentation). */
  LOGFIRE_CONSOLE: z
    .enum(["true", "false"])
    .default("false"),

  /** Outbound email signature (Phase 5) */
  EMAIL_SIGNATORY_NAME: z.string().default("Compliance Team"),
  EMAIL_SIGNATORY_TITLE: z.string().default("Property Manager"),
  EMAIL_COMPANY_NAME: z.string().default("Oakwood Property Management LLC"),
  EMAIL_PROPERTY_NAME: z.string().default("Oakwood Property Management LLC"),

  /** Phase 6 — renewal cron & metrics */
  CRON_SCHEDULE: z.string().default("0 9 * * *"),
  REMINDER_DAYS_BEFORE: z.string().default("30,14,7,3"),
  MANUAL_REVIEW_MINUTES: z.coerce.number().int().min(1).default(20),
  HOURLY_RATE_USD: z.coerce.number().min(0).default(45),
  PLATFORM_COST_ANNUAL_USD: z.coerce.number().min(0).default(1200),

  /** Phase 6 — worker throughput & reliability */
  WORKER_COI_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(2),
  WORKER_REMINDER_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(3),
  REMINDER_EMAIL_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(100),
  REMINDER_EMAIL_RATE_LIMIT_MS: z.coerce.number().int().min(1000).default(60000),
  CRON_LOCK_TTL_SECONDS: z.coerce.number().int().min(60).default(1800),

  /** Domain only — optional documentation for ngrok / webhook setup. */
  WEBHOOK_DOMAIN: z.string().optional(),

  /** Admin login brute-force protection */
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(5),
  LOGIN_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(60).default(900),

  /** JWT session lifetime (seconds) */
  SESSION_MAX_AGE_SECONDS: z.coerce.number().int().min(3600).default(86400),

  /** DLQ manual retry rate limits */
  DLQ_RETRY_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
  DLQ_RETRY_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(60).default(3600),
  DLQ_RETRY_PER_JOB_MAX: z.coerce.number().int().min(1).default(3),
  DLQ_RETRY_PER_JOB_WINDOW_SECONDS: z.coerce.number().int().min(60).default(86400),

  /** Webhook intake limits */
  WEBHOOK_MAX_TEXT_CHARS: z.coerce.number().int().min(1000).default(32768),
  WEBHOOK_INTAKE_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(60),
  WEBHOOK_INTAKE_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(60).default(3600),
  WEBHOOK_AUTOREPLY_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
  WEBHOOK_AUTOREPLY_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(60).default(3600),

  /** Comma-separated proxy IPs — when set, X-Forwarded-For is trusted */
  TRUSTED_PROXY_IPS: z.string().optional(),

  /** Explicit opt-in for unsigned webhooks on non-local databases (dev only) */
  ALLOW_INSECURE_WEBHOOK: z
    .enum(["true", "false"])
    .default("false"),
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

  if (process.env.NODE_ENV === "production") {
    if (!parsed.data.ADMIN_PASSWORD_HASH) {
      throw new Error(
        "ADMIN_PASSWORD_HASH is required in production. Plaintext ADMIN_PASSWORD is not allowed."
      );
    }
    if (parsed.data.ADMIN_PASSWORD) {
      throw new Error(
        "ADMIN_PASSWORD must not be set in production. Use ADMIN_PASSWORD_HASH only."
      );
    }
    if (!parsed.data.AGENTMAIL_WEBHOOK_SECRET?.trim()) {
      throw new Error("AGENTMAIL_WEBHOOK_SECRET is required in production.");
    }
    if (!parsed.data.HEALTH_CHECK_SECRET?.trim()) {
      throw new Error("HEALTH_CHECK_SECRET is required in production.");
    }
    if (!parsed.data.REDIS_URL?.trim()) {
      throw new Error("REDIS_URL is required in production.");
    }
    if (parsed.data.WORKER_FORCE_FAIL?.trim().toLowerCase() === "true") {
      throw new Error("WORKER_FORCE_FAIL must not be enabled in production.");
    }
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

export function getGroqApiKey(): string {
  const key = getEnv().GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is required for Phase 4 AI pipeline.");
  }
  return key;
}

export function getGroqModelChain(): string[] {
  const env = getEnv();
  return [
    env.GROQ_MODEL_PRIMARY,
    env.GROQ_MODEL_FALLBACK_1,
    env.GROQ_MODEL_FALLBACK_2,
  ];
}

export function getLlamaCloudApiKey(): string {
  const key = getEnv().LLAMA_CLOUD_API_KEY;
  if (!key) {
    throw new Error("LLAMA_CLOUD_API_KEY is required for Phase 4 OCR.");
  }
  return key;
}

export function getLogfireToken(): string | undefined {
  const token = getEnv().LOGFIRE_TOKEN?.trim();
  return token || undefined;
}

export function shouldSendToLogfire(): boolean {
  const env = getEnv();
  if (env.LOGFIRE_SEND_TO_LOGFIRE === "true") return true;
  if (env.LOGFIRE_SEND_TO_LOGFIRE === "false") return false;
  return Boolean(getLogfireToken());
}

export function resetEnvCache(): void {
  cachedEnv = null;
}

export function getReminderDaysBefore(): number[] {
  const raw = getEnv().REMINDER_DAYS_BEFORE;
  return raw
    .split(",")
    .map((part) => parseInt(part.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => b - a);
}


import OpenAI from "openai";
import {
  getEnv,
  getGroqApiKey,
  getGroqModelChain,
} from "@/lib/env";

let groqClient: OpenAI | null = null;

const MAX_RETRIES_PER_MODEL = 3;
const BASE_RETRY_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getGroqClient(): OpenAI {
  if (!groqClient) {
    const env = getEnv();
    groqClient = new OpenAI({
      apiKey: getGroqApiKey(),
      baseURL: env.GROQ_BASE_URL,
      timeout: env.AI_REQUEST_TIMEOUT_MS,
    });
  }
  return groqClient;
}

export function isRetryableGroqError(error: unknown): boolean {
  if (!(error instanceof OpenAI.APIError)) {
    return false;
  }
  return [429, 500, 502, 503, 504].includes(error.status ?? 0);
}

function getRetryDelayMs(error: unknown, attempt: number): number {
  if (error instanceof OpenAI.APIError && error.status === 429) {
    const retryAfter = error.headers?.["retry-after"];
    if (retryAfter) {
      const seconds = Number.parseInt(String(retryAfter), 10);
      if (!Number.isNaN(seconds) && seconds > 0) {
        return seconds * 1000;
      }
    }
  }
  return BASE_RETRY_DELAY_MS * 2 ** attempt;
}

export interface GroqChatResult {
  content: string;
  model: string;
}

export async function chatWithGroqFallback(options: {
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  temperature?: number;
  responseFormat?: "json_object";
}): Promise<GroqChatResult> {
  const client = getGroqClient();
  const models = getGroqModelChain();
  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const response = await client.chat.completions.create({
          model,
          messages: options.messages,
          temperature: options.temperature ?? 0.1,
          ...(options.responseFormat
            ? { response_format: { type: options.responseFormat } }
            : {}),
        });
        const content = response.choices[0]?.message?.content?.trim();
        if (!content) {
          throw new Error(`Empty response from model ${model}`);
        }
        return { content, model };
      } catch (error) {
        lastError = error;
        const retryable = isRetryableGroqError(error);
        const hasRetriesLeft = attempt < MAX_RETRIES_PER_MODEL - 1;

        if (retryable && hasRetriesLeft) {
          await sleep(getRetryDelayMs(error, attempt));
          continue;
        }

        if (retryable) {
          break;
        }

        throw error;
      }
    }
  }

  if (lastError instanceof OpenAI.APIError && lastError.status === 429) {
    throw new Error(
      "Groq rate limit exceeded on all models. Wait a minute and retry, or upgrade your Groq plan."
    );
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All Groq models failed");
}

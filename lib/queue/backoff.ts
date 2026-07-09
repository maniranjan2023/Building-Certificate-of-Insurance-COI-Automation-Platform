import { getEnv } from "@/lib/env";

/** Exponential backoff with up to 25% jitter to avoid retry spikes. */
export function computeBackoffDelayMs(attemptsMade: number): number {
  const env = getEnv();
  const attempt = Math.max(1, attemptsMade);
  const base = env.JOB_BACKOFF_DELAY_MS * 2 ** (attempt - 1);
  const jitter = Math.floor(Math.random() * base * 0.25);
  return base + jitter;
}

export function createBackoffStrategy() {
  return (attemptsMade: number): number => computeBackoffDelayMs(attemptsMade);
}

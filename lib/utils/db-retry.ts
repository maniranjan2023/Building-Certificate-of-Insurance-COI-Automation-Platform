/**
 * Retry DB operations when Neon is waking from sleep or the network blips.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  options: { attempts?: number; delayMs?: number; label?: string } = {}
): Promise<T> {
  const attempts = options.attempts ?? 5;
  const delayMs = options.delayMs ?? 3000;
  const label = options.label ?? "database operation";

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable =
        message.includes("Can't reach database server") ||
        message.includes("Connection terminated") ||
        message.includes("ECONNRESET") ||
        message.includes("ETIMEDOUT") ||
        message.includes("Connection timed out") ||
        message.includes("Client network socket disconnected");

      if (!retryable || attempt === attempts) {
        throw error;
      }

      console.warn(
        `[db-retry] ${label} failed (attempt ${attempt}/${attempts}): ${message}. Retrying in ${delayMs}ms…`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

export async function ensureDatabaseReady(): Promise<void> {
  const { prisma } = await import("@/lib/prisma");
  await withDbRetry(
    async () => {
      await prisma.$queryRaw`SELECT 1`;
    },
    { label: "database wake-up ping", attempts: 6, delayMs: 4000 }
  );
}

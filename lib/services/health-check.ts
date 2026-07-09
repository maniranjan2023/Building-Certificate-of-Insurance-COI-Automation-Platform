import { prisma } from "@/lib/prisma";
import { getRedisUrl, tryGetEnv } from "@/lib/env";
import { getQueueMetricsSnapshot } from "@/lib/services/queue-metrics";
import Redis from "ioredis";

export interface HealthCheckResult {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  message?: string;
}

export interface FullHealthReport {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  app: HealthCheckResult;
  database: HealthCheckResult;
  redis: HealthCheckResult;
  queues: HealthCheckResult & {
    details?: Awaited<ReturnType<typeof getQueueMetricsSnapshot>>;
  };
}

export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      message: `Neon reachable in ${Date.now() - started}ms`,
    };
  } catch (error) {
    return {
      status: "error",
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : "Database unreachable",
    };
  }
}

export async function checkRedisHealth(): Promise<HealthCheckResult> {
  const started = Date.now();
  let client: Redis | null = null;
  try {
    if (!tryGetEnv()?.REDIS_URL) {
      return {
        status: "error",
        timestamp: new Date().toISOString(),
        message: "REDIS_URL is not configured",
      };
    }

    client = new Redis(getRedisUrl(), {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });
    const pong = await client.ping();
    return {
      status: pong === "PONG" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      message: `Redis reachable in ${Date.now() - started}ms`,
    };
  } catch (error) {
    return {
      status: "error",
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : "Redis unreachable",
    };
  } finally {
    if (client) {
      await client.quit().catch(() => undefined);
    }
  }
}

export async function checkQueuesHealth(): Promise<FullHealthReport["queues"]> {
  try {
    const details = await getQueueMetricsSnapshot();
    const backlog =
      details.queues.reduce((sum, queue) => sum + queue.waiting + queue.delayed, 0) +
      details.database.dlq +
      details.database.reminderDlq;

    return {
      status: backlog > 500 ? "degraded" : "ok",
      timestamp: new Date().toISOString(),
      message:
        backlog > 0
          ? `${backlog} job(s) waiting or in DLQ`
          : "Queues idle",
      details,
    };
  } catch (error) {
    return {
      status: "error",
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : "Queue metrics unavailable",
    };
  }
}

export async function getFullHealthReport(): Promise<FullHealthReport> {
  const [database, redis, queues] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkQueuesHealth(),
  ]);

  const statuses = [database.status, redis.status, queues.status];
  const overall: FullHealthReport["status"] = statuses.includes("error")
    ? "error"
    : statuses.includes("degraded")
      ? "degraded"
      : "ok";

  return {
    status: overall,
    timestamp: new Date().toISOString(),
    app: {
      status: "ok",
      timestamp: new Date().toISOString(),
      message: "COI platform API is running",
    },
    database,
    redis,
    queues,
  };
}

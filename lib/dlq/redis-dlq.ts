import { getOptionalRedis } from "@/lib/security/redis-client";
import { getRedisUrl } from "@/lib/env";
import Redis from "ioredis";
import { logError, logInfo } from "@/lib/observability/logfire.node";

export interface DlqEntry {
  id: string;
  eventName: string;
  payload: Record<string, unknown>;
  error: string;
  stack?: string;
  failedAt: string;
  retryCount: number;
  executionId: string;
  metadata?: Record<string, unknown>;
}

const DLQ_KEY_PREFIX = "dlq:";
const DLQ_INDEX_KEY = "dlq:index";

let dedicatedClient: Redis | null = null;

function getDlqRedis(): Redis {
  const shared = getOptionalRedis();
  if (shared) return shared;

  if (!dedicatedClient) {
    dedicatedClient = new Redis(getRedisUrl(), {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
  }
  return dedicatedClient;
}

function entryKey(id: string): string {
  return `${DLQ_KEY_PREFIX}${id}`;
}

export async function writeDlqEntry(entry: DlqEntry): Promise<void> {
  const redis = getDlqRedis();
  if (redis.status !== "ready") {
    await redis.connect().catch(() => undefined);
  }

  const key = entryKey(entry.id);
  const score = Date.parse(entry.failedAt) || Date.now();

  await redis
    .multi()
    .set(key, JSON.stringify(entry))
    .zadd(DLQ_INDEX_KEY, score, entry.id)
    .exec();

  logInfo("dlq.written", {
    id: entry.id,
    eventName: entry.eventName,
    executionId: entry.executionId,
    retryCount: entry.retryCount,
    error: entry.error,
  });
}

export async function getDlqEntry(id: string): Promise<DlqEntry | null> {
  const redis = getDlqRedis();
  if (redis.status !== "ready") {
    await redis.connect().catch(() => undefined);
  }

  const raw = await redis.get(entryKey(id));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DlqEntry;
  } catch (error) {
    logError("dlq.parse_failed", error, { id });
    return null;
  }
}

export async function listDlqEntries(options?: {
  limit?: number;
  offset?: number;
}): Promise<DlqEntry[]> {
  const redis = getDlqRedis();
  if (redis.status !== "ready") {
    await redis.connect().catch(() => undefined);
  }

  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;
  const ids = await redis.zrevrange(DLQ_INDEX_KEY, offset, offset + limit - 1);

  if (!ids.length) return [];

  const values = await redis.mget(...ids.map(entryKey));
  const entries: DlqEntry[] = [];

  for (let i = 0; i < ids.length; i++) {
    const raw = values[i];
    if (!raw) continue;
    try {
      entries.push(JSON.parse(raw) as DlqEntry);
    } catch {
      // Skip corrupt entries.
    }
  }

  return entries;
}

export async function deleteDlqEntry(id: string): Promise<boolean> {
  const redis = getDlqRedis();
  if (redis.status !== "ready") {
    await redis.connect().catch(() => undefined);
  }

  const result = await redis
    .multi()
    .del(entryKey(id))
    .zrem(DLQ_INDEX_KEY, id)
    .exec();

  const deleted = Number(result?.[0]?.[1] ?? 0) > 0;
  if (deleted) {
    logInfo("dlq.deleted", { id });
  }
  return deleted;
}

export async function countDlqEntries(): Promise<number> {
  const redis = getDlqRedis();
  if (redis.status !== "ready") {
    await redis.connect().catch(() => undefined);
  }
  return redis.zcard(DLQ_INDEX_KEY);
}

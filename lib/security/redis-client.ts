import Redis from "ioredis";
import { getRedisUrl, tryGetEnv } from "@/lib/env";

let sharedClient: Redis | null = null;

export function getOptionalRedis(): Redis | null {
  if (!tryGetEnv()?.REDIS_URL) {
    return null;
  }

  if (!sharedClient) {
    sharedClient = new Redis(getRedisUrl(), {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }

  return sharedClient;
}

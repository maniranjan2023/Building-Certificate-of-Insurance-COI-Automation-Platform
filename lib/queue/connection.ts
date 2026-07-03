import type { ConnectionOptions } from "bullmq";
import { getRedisUrl } from "@/lib/env";

export function getQueueConnection(): ConnectionOptions {
  return {
    url: getRedisUrl(),
    maxRetriesPerRequest: null,
  };
}

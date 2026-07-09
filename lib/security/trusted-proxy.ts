import { getEnv, tryGetEnv } from "@/lib/env";

function parseTrustedProxies(): Set<string> {
  const raw = tryGetEnv()?.TRUSTED_PROXY_IPS?.trim();
  if (!raw) {
    return new Set();
  }
  return new Set(
    raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
  );
}

export function getClientIp(request: Request): string {
  const trusted = parseTrustedProxies();
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip")?.trim();

  if (forwarded && trusted.size > 0) {
    const hops = forwarded.split(",").map((part) => part.trim());
    const client = hops[hops.length - 1];
    if (client) {
      return client;
    }
  }

  if (realIp && trusted.size > 0) {
    return realIp;
  }

  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  return realIp || "unknown";
}

export function isTrustedProxyDeployment(): boolean {
  return parseTrustedProxies().size > 0;
}

export function getTrustedProxyConfig(): string | undefined {
  return getEnv().TRUSTED_PROXY_IPS;
}

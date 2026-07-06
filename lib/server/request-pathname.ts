import { headers } from "next/headers";
import { normalizePathname } from "@/lib/utils/pathname";

export async function getRequestPathname(
  fallback = "/dashboard"
): Promise<string> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname");
  if (!pathname) return fallback;
  return normalizePathname(pathname);
}

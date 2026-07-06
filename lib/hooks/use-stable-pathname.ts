"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { normalizePathname } from "@/lib/utils/pathname";

/**
 * Keeps the first paint aligned with SSR (initialPathname from middleware header),
 * then syncs to client navigations after hydration.
 */
export function useStablePathname(initialPathname: string): string {
  const clientPathname = usePathname();
  const [pathname, setPathname] = useState(() =>
    normalizePathname(initialPathname)
  );

  useEffect(() => {
    setPathname(normalizePathname(clientPathname));
  }, [clientPathname]);

  return pathname;
}

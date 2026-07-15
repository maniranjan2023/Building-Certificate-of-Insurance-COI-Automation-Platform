"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Clears the App Router client cache so each sidebar navigation (and tab focus)
 * re-fetches Server Component data instead of showing a stale snapshot.
 */
export function RefreshOnRouteChange() {
  const pathname = usePathname();
  const router = useRouter();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    router.refresh();
  }, [pathname, router]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }

    function onFocus() {
      router.refresh();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [router]);

  return null;
}

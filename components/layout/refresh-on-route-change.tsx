"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Re-fetches Server Component data after soft navigations settle, and when
 * the browser tab becomes visible again — without fighting the page loader.
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

    // Wait for WorkspacePageTransition settle before refreshing under the hood.
    const timer = window.setTimeout(() => {
      router.refresh();
    }, 420);

    return () => window.clearTimeout(timer);
  }, [pathname, router]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  return null;
}

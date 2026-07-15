"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

interface NavigationPendingContextValue {
  pendingHref: string | null;
  isNavigating: boolean;
  setPendingHref: (href: string | null) => void;
  /** Call once destination page content has painted and is ready to show. */
  markContentReady: () => void;
}

const WORKSPACE_HREF =
  /^\/(dashboard|tenants|checklist|templates|metrics)(\/|$|\?)/;

const NavigationPendingContext = createContext<NavigationPendingContextValue>({
  pendingHref: null,
  isNavigating: false,
  setPendingHref: () => undefined,
  markContentReady: () => undefined,
});

function normalizeHref(href: string): string {
  const withoutQuery = href.split("?")[0]?.split("#")[0] ?? href;
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
}

function pathMatchesTarget(pathname: string, target: string): boolean {
  const path = normalizeHref(pathname);
  const href = normalizeHref(target);
  if (path === href) return true;
  if (href === "/dashboard") return path === "/dashboard";
  return path.startsWith(`${href}/`);
}

export function NavigationPendingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHrefState] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const pendingHrefRef = useRef<string | null>(null);

  const setPendingHref = useCallback(
    (href: string | null) => {
      if (!href) {
        pendingHrefRef.current = null;
        setPendingHrefState(null);
        setIsNavigating(false);
        return;
      }

      const next = normalizeHref(href);
      if (pathMatchesTarget(pathname, next)) {
        return;
      }

      pendingHrefRef.current = next;
      setPendingHrefState(next);
      setIsNavigating(true);
    },
    [pathname]
  );

  const markContentReady = useCallback(() => {
    if (!pendingHrefRef.current) return;
    if (!pathMatchesTarget(pathname, pendingHrefRef.current)) return;

    pendingHrefRef.current = null;
    setPendingHrefState(null);
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto:")) return;
      if (!WORKSPACE_HREF.test(href)) return;

      setPendingHref(href);
    }

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [setPendingHref]);

  // Safety: never leave the loader hanging forever if RSC fails silently.
  useEffect(() => {
    if (!pendingHref) return;
    if (!pathMatchesTarget(pathname, pendingHref)) return;

    const timer = window.setTimeout(() => {
      markContentReady();
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [pathname, pendingHref, markContentReady]);

  const value = useMemo(
    () => ({ pendingHref, isNavigating, setPendingHref, markContentReady }),
    [pendingHref, isNavigating, setPendingHref, markContentReady]
  );

  return (
    <NavigationPendingContext.Provider value={value}>
      {children}
    </NavigationPendingContext.Provider>
  );
}

export function useNavigationPending() {
  return useContext(NavigationPendingContext);
}

/** Animated top progress bar (optional — unused by default shell). */
export function NavigationProgressBar() {
  return null;
}

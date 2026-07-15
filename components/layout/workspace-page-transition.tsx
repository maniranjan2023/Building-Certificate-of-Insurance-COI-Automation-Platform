"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useNavigationPending } from "@/components/layout/navigation-pending";
import { resolveShadcnPageSkeleton } from "@/components/skeletons/shadcn-page-skeletons";
import { cn } from "@/lib/utils";

function pathMatchesTarget(pathname: string, target: string): boolean {
  if (pathname === target) return true;
  if (target === "/dashboard") return pathname === "/dashboard";
  return pathname === target || pathname.startsWith(`${target}/`);
}

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/**
 * Shows a shadcn Skeleton layout immediately on tab/link click, and hides it
 * only after the destination route content has painted — never a blank screen.
 */
export function WorkspacePageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { pendingHref, isNavigating, markContentReady } = useNavigationPending();
  const contentRef = useRef<HTMLDivElement>(null);
  const [heldHref, setHeldHref] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    if (pendingHref) {
      setHeldHref(pendingHref);
      setRevealing(false);
    }
  }, [pendingHref]);

  useEffect(() => {
    if (!heldHref) return;
    if (!pathMatchesTarget(pathname, heldHref)) return;

    let cancelled = false;
    let observer: ResizeObserver | null = null;
    let safetyTimer: number | undefined;

    async function waitUntilContentReady() {
      await waitForNextPaint();
      if (cancelled) return;

      const el = contentRef.current;
      if (!el) {
        markContentReady();
        return;
      }

      const tryReveal = () => {
        if (cancelled) return false;
        const height = el.getBoundingClientRect().height;
        const hasNodes = el.childElementCount > 0;
        if (height < 48 || !hasNodes) return false;

        setRevealing(true);
        window.setTimeout(() => {
          if (cancelled) return;
          setHeldHref(null);
          setRevealing(false);
          markContentReady();
        }, 180);
        return true;
      };

      if (tryReveal()) return;

      observer = new ResizeObserver(() => {
        if (tryReveal()) {
          observer?.disconnect();
          observer = null;
        }
      });
      observer.observe(el);

      safetyTimer = window.setTimeout(() => {
        observer?.disconnect();
        if (!cancelled) {
          setRevealing(true);
          window.setTimeout(() => {
            if (cancelled) return;
            setHeldHref(null);
            setRevealing(false);
            markContentReady();
          }, 160);
        }
      }, 4500);
    }

    void waitUntilContentReady();

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (safetyTimer) window.clearTimeout(safetyTimer);
    };
  }, [pathname, heldHref, markContentReady]);

  const loading = Boolean(heldHref) || isNavigating;
  const skeletonHref = heldHref ?? pendingHref ?? pathname;

  return (
    <div className="relative min-h-[55vh] min-w-0">
      <div
        ref={contentRef}
        key={pathname}
        className={cn(
          "min-w-0 transition-opacity duration-300 ease-out",
          loading
            ? "pointer-events-none absolute inset-x-0 top-0 opacity-0"
            : "relative opacity-100 animate-in fade-in duration-300"
        )}
        aria-hidden={loading}
      >
        {children}
      </div>

      {loading ? (
        <div
          className={cn(
            "min-w-0 transition-opacity duration-300 ease-out",
            revealing ? "opacity-0" : "opacity-100 animate-in fade-in duration-200"
          )}
          aria-busy="true"
          aria-live="polite"
          aria-label="Loading page"
        >
          {resolveShadcnPageSkeleton(skeletonHref)}
        </div>
      ) : null}
    </div>
  );
}

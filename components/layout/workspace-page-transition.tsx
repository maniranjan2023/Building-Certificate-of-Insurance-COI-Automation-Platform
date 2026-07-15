"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useNavigationPending } from "@/components/layout/navigation-pending";
import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { Spinner } from "@/components/ui/spinner";
import { DashboardPortfolioFixture } from "@/components/skeletons/fixtures/dashboard-portfolio";
import { JobsPageFixture } from "@/components/skeletons/fixtures/jobs";
import { TenantsPageFixture } from "@/components/skeletons/fixtures/tenants";
import { TenantDetailFixture } from "@/components/skeletons/fixtures/tenant-detail";
import { ChecklistPageFixture } from "@/components/skeletons/fixtures/checklist";
import { TemplatesPageFixture } from "@/components/skeletons/fixtures/templates";
import { MetricsPageFixture } from "@/components/skeletons/fixtures/metrics";
import { CoiDetailFixture } from "@/components/skeletons/fixtures/coi-detail";
import { CompareVersionsFixture } from "@/components/skeletons/fixtures/compare";
import { cn } from "@/lib/utils";

function resolveRouteSkeleton(href: string): { name: string; fixture: ReactNode } {
  if (href.startsWith("/dashboard/jobs")) {
    return { name: "dashboard-jobs", fixture: <JobsPageFixture /> };
  }
  if (href.startsWith("/dashboard/compare")) {
    return { name: "dashboard-compare", fixture: <CompareVersionsFixture /> };
  }
  if (/^\/dashboard\/[^/]+$/.test(href)) {
    return { name: "coi-detail", fixture: <CoiDetailFixture /> };
  }
  if (href === "/dashboard") {
    return { name: "dashboard-portfolio", fixture: <DashboardPortfolioFixture /> };
  }
  if (/^\/tenants\/[^/]+$/.test(href)) {
    return { name: "tenant-detail", fixture: <TenantDetailFixture /> };
  }
  if (href.startsWith("/tenants")) {
    return { name: "tenants-list", fixture: <TenantsPageFixture /> };
  }
  if (href.startsWith("/checklist")) {
    return { name: "checklist", fixture: <ChecklistPageFixture /> };
  }
  if (href.startsWith("/templates")) {
    return { name: "templates", fixture: <TemplatesPageFixture /> };
  }
  if (href.startsWith("/metrics")) {
    return { name: "metrics", fixture: <MetricsPageFixture /> };
  }
  return { name: "dashboard-portfolio", fixture: <DashboardPortfolioFixture /> };
}

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
 * Smooth shadcn/21st-style page loader: skeleton stays up until the destination
 * route URL matches AND the page content has painted into the DOM.
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
        }, 220);
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
          }, 180);
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
  const skeleton = resolveRouteSkeleton(skeletonHref);

  return (
    <div className="relative min-h-[55vh] min-w-0">
      <div
        ref={contentRef}
        key={pathname}
        className={cn(
          "min-w-0 transition-[opacity,transform,filter] duration-300 ease-out",
          loading
            ? "pointer-events-none absolute inset-x-0 top-0 translate-y-1 scale-[0.995] opacity-0 blur-[2px]"
            : "relative translate-y-0 scale-100 opacity-100 blur-0 animate-in fade-in duration-300"
        )}
        aria-hidden={loading}
      >
        {children}
      </div>

      {loading ? (
        <div
          className={cn(
            "min-w-0 transition-opacity duration-300 ease-out",
            revealing
              ? "opacity-0"
              : "animate-in fade-in slide-in-from-bottom-1 duration-300 opacity-100"
          )}
          aria-busy="true"
          aria-live="polite"
          aria-label="Loading page"
        >
          <div className="mb-3 flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
            <Spinner className="size-3.5 text-primary" label="Loading workspace" />
            Loading workspace…
          </div>
          <RouteSkeleton name={skeleton.name} fixture={skeleton.fixture} />
        </div>
      ) : null}
    </div>
  );
}

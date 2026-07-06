"use client";

import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import {
  PRODUCT_NAME,
  getActiveNavContext,
  getSubPageLabel,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface WorkspaceHeaderProps {
  pathname: string;
}

export function WorkspaceHeader({ pathname }: WorkspaceHeaderProps) {
  const { section, item } = getActiveNavContext(pathname);
  const subPage = getSubPageLabel(pathname, item?.href);
  const pageTitle = subPage ?? item?.label ?? "Dashboard";
  const pageDescription =
    subPage === "Submission review"
      ? "Review document, AI pipeline output, and tenant actions"
      : subPage === "Tenant profile"
        ? "Full activity timeline for this tenant"
        : subPage === "Compare versions"
          ? "Side-by-side diff across COI versions"
          : item?.description;

  const crumbs: string[] = [];
  if (section) crumbs.push(section.title);
  if (item) crumbs.push(item.label);
  if (subPage) crumbs.push(subPage);

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b bg-background/85 backdrop-blur-md">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"
      />

      <div className="flex min-h-[4.25rem] items-center gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
          <Link
            href="/dashboard"
            className="hidden shrink-0 items-center gap-2 rounded-xl border bg-muted/40 px-2.5 py-1.5 transition-colors hover:bg-muted/60 sm:flex"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">{PRODUCT_NAME}</span>
          </Link>

          <div className="hidden h-8 w-px shrink-0 bg-border sm:block" aria-hidden />

          <div className="min-w-0 flex-1">
            {crumbs.length > 0 ? (
              <nav
                aria-label="Breadcrumb"
                className="mb-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
              >
                {crumbs.map((label, index) => {
                  const isLast = index === crumbs.length - 1;

                  return (
                    <span
                      key={`${label}-${index}`}
                      className="inline-flex items-center gap-1"
                    >
                      {index > 0 ? (
                        <ChevronRight
                          className="size-3 shrink-0 opacity-50"
                          aria-hidden
                        />
                      ) : null}
                      <span
                        className={cn(
                          "truncate",
                          isLast && "font-medium text-foreground"
                        )}
                      >
                        {label}
                      </span>
                    </span>
                  );
                })}
              </nav>
            ) : null}

            <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">
              {pageTitle}
            </h1>

            {pageDescription ? (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {pageDescription}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 md:inline-flex">
            Live
          </span>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Phase 5
          </span>
        </div>
      </div>
    </header>
  );
}

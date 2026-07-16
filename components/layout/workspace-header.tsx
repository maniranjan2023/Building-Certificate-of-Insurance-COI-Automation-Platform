"use client";

import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import {
  PRODUCT_NAME,
  getActiveNavContext,
  getSubPageLabel,
} from "@/lib/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

interface WorkspaceHeaderProps {
  pathname: string;
}

export function WorkspaceHeader({ pathname }: WorkspaceHeaderProps) {
  const { section, item } = getActiveNavContext(pathname);
  const subPage = getSubPageLabel(pathname, item?.href);
  const pageTitle = subPage ?? item?.label ?? "Dashboard";

  const crumbs: Array<{ label: string; href?: string }> = [];
  if (section) crumbs.push({ label: section.title });
  if (item) crumbs.push({ label: item.label, href: item.href });
  if (subPage) crumbs.push({ label: subPage });

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center gap-3 px-4 md:gap-4 md:px-6">
        <Link
          href="/dashboard"
          className="hidden shrink-0 items-center gap-2 sm:flex"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-blue-600 text-white">
            <ShieldCheck className="size-3.5" strokeWidth={2.25} />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            {PRODUCT_NAME}
          </span>
        </Link>

        <div className="hidden h-5 w-px shrink-0 bg-border sm:block" aria-hidden />

        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden text-sm"
        >
          {crumbs.length > 0 ? (
            crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <span
                  key={`${crumb.label}-${index}`}
                  className="inline-flex min-w-0 items-center gap-1"
                >
                  {index > 0 ? (
                    <ChevronRight
                      className="size-3.5 shrink-0 text-muted-foreground/60"
                      aria-hidden
                    />
                  ) : null}
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="truncate text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        "truncate",
                        isLast
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {isLast ? pageTitle : crumb.label}
                    </span>
                  )}
                </span>
              );
            })
          ) : (
            <span className="truncate font-medium text-foreground">
              {pageTitle}
            </span>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

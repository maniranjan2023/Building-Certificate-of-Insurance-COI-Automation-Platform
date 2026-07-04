"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { dashboardNavigation } from "@/lib/navigation";

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail: string;
}

export function DashboardShell({ children, userEmail }: DashboardShellProps) {
  const pathname = usePathname();

  const pageTitle =
    dashboardNavigation
      .flatMap((section) => section.items)
      .filter((item) => item.enabled)
      .sort((a, b) => b.href.length - a.href.length)
      .find(
        (item) =>
          pathname === item.href || pathname.startsWith(`${item.href}/`)
      )?.label ?? "Dashboard";

  return (
    <SidebarProvider>
      <AppSidebar userEmail={userEmail} />
      <SidebarInset>
        <header className="flex h-11 shrink-0 items-center gap-2 border-b px-3">
          <SidebarTrigger className="-ml-0.5 size-7" />
          <Separator
            orientation="vertical"
            className="mr-1 data-[orientation=vertical]:h-3.5"
          />
          <div className="flex flex-1 items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Workspace
              </p>
              <h1 className="text-lg font-semibold tracking-tight">{pageTitle}</h1>
            </div>
            <div className="hidden rounded border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:block">
              Phase 3
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-3 p-3 md:p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

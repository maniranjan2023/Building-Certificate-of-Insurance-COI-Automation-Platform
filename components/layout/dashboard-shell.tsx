"use client";

import { SessionNavBar, SESSION_NAVBAR_WIDTH } from "@/components/ui/session-nav-bar";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { useStablePathname } from "@/lib/hooks/use-stable-pathname";

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail: string;
  initialPathname: string;
}

export function DashboardShell({
  children,
  userEmail,
  initialPathname,
}: DashboardShellProps) {
  const pathname = useStablePathname(initialPathname);

  return (
    <div className="flex min-h-svh w-full">
      <SessionNavBar userEmail={userEmail} />
      <div
        className="flex min-h-svh min-w-0 flex-1 flex-col"
        style={{ marginLeft: SESSION_NAVBAR_WIDTH }}
      >
        <WorkspaceHeader pathname={pathname} />
        <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-x-hidden bg-muted/20 p-4 md:p-6">
          <div className="min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getRequestPathname } from "@/lib/server/request-pathname";

/** Always render fresh DB-backed pages — never serve a static workspace snapshot. */
export const dynamic = "force-dynamic";

/**
 * Single shell for all authenticated workspace sections.
 * Keeping one layout means sidebar nav stays mounted and route `loading.tsx`
 * skeletons paint immediately instead of a blank remount between sections.
 */
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const pathname = await getRequestPathname("/dashboard");

  return (
    <DashboardShell userEmail={session.email} initialPathname={pathname}>
      {children}
    </DashboardShell>
  );
}

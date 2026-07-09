import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getRequestPathname } from "@/lib/server/request-pathname";

export default async function MetricsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const pathname = await getRequestPathname("/metrics");

  return (
    <DashboardShell userEmail={session.email} initialPathname={pathname}>
      {children}
    </DashboardShell>
  );
}

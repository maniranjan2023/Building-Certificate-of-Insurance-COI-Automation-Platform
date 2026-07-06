import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ensureDatabaseReady } from "@/lib/utils/db-retry";
import { getRequestPathname } from "@/lib/server/request-pathname";

export default async function TenantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  await ensureDatabaseReady();

  const pathname = await getRequestPathname("/tenants");

  return (
    <DashboardShell userEmail={session.email} initialPathname={pathname}>
      {children}
    </DashboardShell>
  );
}

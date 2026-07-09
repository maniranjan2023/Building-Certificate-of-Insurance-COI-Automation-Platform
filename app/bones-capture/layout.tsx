import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getRequestPathname } from "@/lib/server/request-pathname";

/** Auth-protected layout for boneyard CLI fixture capture only. */
export default async function BonesCaptureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const pathname = await getRequestPathname("/bones-capture");

  return (
    <DashboardShell userEmail={session.email} initialPathname={pathname}>
      {children}
    </DashboardShell>
  );
}

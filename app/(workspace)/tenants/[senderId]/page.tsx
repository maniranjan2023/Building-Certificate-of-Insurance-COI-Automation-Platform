import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTenantActivityBySenderId } from "@/lib/services/tenant-activity";
import {
  TenantActivitySummaryCards,
  TenantActivityTimeline,
} from "@/components/tenants/tenant-activity-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { COI_STATUS_LABELS } from "@/lib/services/version-labels";
import { VersionBadge } from "@/components/ui/version-badge";
import { formatDate } from "@/lib/utils";
import type { CoiStatus } from "@prisma/client";

interface TenantDetailPageProps {
  params: Promise<{ senderId: string }>;
}

export default async function TenantDetailPage({ params }: TenantDetailPageProps) {
  const { senderId } = await params;
  const activity = await getTenantActivityBySenderId(senderId);

  if (!activity) {
    notFound();
  }

  const { sender, summary, events, versions } = activity;
  const displayName = sender.displayName ?? sender.email;

  return (
    <div className="space-y-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-1 h-8 px-0 text-sm">
          <Link href="/tenants">
            <ArrowLeft className="size-3" />
            All tenants
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">{displayName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {sender.email}
          {sender.displayName ? ` · tenant since ${formatDate(sender.createdAt)}` : null}
        </p>
      </div>

      <TenantActivitySummaryCards {...summary} />

      <Card className="gap-3 py-4">
        <CardHeader className="gap-1 px-4 pb-0">
          <CardTitle className="text-lg">COI versions</CardTitle>
          <CardDescription className="text-sm">
            Open any version to inspect the full AI agent pipeline and review actions
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Version</th>
                  <th className="px-4 py-3 font-medium">File</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Emails</th>
                  <th className="px-4 py-3 font-medium">AI steps</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {[...versions].reverse().map((version) => (
                  <tr key={version.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/${version.coiDocumentId}`}
                        className="inline-flex items-center gap-2 hover:underline"
                      >
                        <VersionBadge versionNumber={version.versionNumber} />
                      </Link>
                    </td>
                    <td className="max-w-[12rem] truncate px-4 py-3">{version.fileName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={version.status as CoiStatus}
                        label={COI_STATUS_LABELS[version.status as CoiStatus]}
                      />
                    </td>
                    <td className="px-4 py-3 tabular-nums">{version.emailCount}</td>
                    <td className="px-4 py-3 tabular-nums">{version.agentStepCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(version.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-3 py-4">
        <CardHeader className="gap-1 px-4 pb-0">
          <CardTitle className="text-lg">Full activity timeline</CardTitle>
          <CardDescription className="text-sm">
            {events.length} events — uploads, processing jobs, AI agents, and outbound emails
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <TenantActivityTimeline events={events} />
        </CardContent>
      </Card>
    </div>
  );
}

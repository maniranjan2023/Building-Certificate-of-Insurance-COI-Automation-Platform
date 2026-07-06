import Link from "next/link";
import { History } from "lucide-react";
import {
  getDocumentActivityEvents,
  resolveSenderIdForDocument,
} from "@/lib/services/tenant-activity";
import { TenantActivityTimeline } from "@/components/tenants/tenant-activity-timeline";
import { Button } from "@/components/ui/button";

interface DocumentActivityPanelProps {
  coiDocumentId: string;
}

export async function DocumentActivityPanel({ coiDocumentId }: DocumentActivityPanelProps) {
  const [events, senderRef] = await Promise.all([
    getDocumentActivityEvents(coiDocumentId),
    resolveSenderIdForDocument(coiDocumentId),
  ]);

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="font-semibold tracking-tight">Activity log</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Emails, jobs, and AI steps for this submission
          </p>
        </div>
        {senderRef ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/tenants/${senderRef.senderId}`}>
              <History className="size-3.5" />
              Full tenant history
            </Link>
          </Button>
        ) : null}
      </div>
      <div className="min-w-0 p-5">
        <TenantActivityTimeline
          events={events}
          showCoiLinks={false}
          compact
          emptyMessage="No activity for this document."
        />
      </div>
    </section>
  );
}

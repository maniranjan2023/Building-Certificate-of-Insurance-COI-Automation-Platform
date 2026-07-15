import Link from "next/link";
import { History } from "lucide-react";
import {
  getDocumentActivityEvents,
  resolveSenderIdForDocument,
} from "@/lib/services/tenant-activity";
import { DocumentActivityTable } from "@/components/tenants/document-activity-table";
import { Button } from "@/components/ui/button";

interface DocumentActivityPanelProps {
  coiDocumentId: string;
}

export async function DocumentActivityPanel({
  coiDocumentId,
}: DocumentActivityPanelProps) {
  const [events, senderRef] = await Promise.all([
    getDocumentActivityEvents(coiDocumentId),
    resolveSenderIdForDocument(coiDocumentId),
  ]);

  return (
    <DocumentActivityTable
      events={events}
      emptyMessage="No activity for this document yet."
      headerAction={
        senderRef ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/tenants/${senderRef.senderId}`}>
              <History className="size-3.5" />
              Full tenant history
            </Link>
          </Button>
        ) : null
      }
    />
  );
}

"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuditExportButtonProps {
  documentId: string;
}

export function AuditExportButton({ documentId }: AuditExportButtonProps) {
  return (
    <Button asChild size="sm" variant="outline">
      <a href={`/api/coi/${documentId}/audit-export`} download>
        <Download className="size-3.5" />
        Export audit
      </a>
    </Button>
  );
}

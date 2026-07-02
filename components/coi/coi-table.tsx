import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { CoiDocument } from "@prisma/client";
import { COI_STATUS_LABELS } from "@/lib/services/coi";
import { formatBytes, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CoiTableProps {
  documents: CoiDocument[];
}

const compactCardClass = "gap-3 py-4";
const compactHeaderClass = "gap-1 px-4 pb-0";
const compactContentClass = "px-4 pb-4";
const compactTitleClass = "text-base";

export function CoiTable({ documents }: CoiTableProps) {
  if (documents.length === 0) {
    return (
      <Card className={compactCardClass}>
        <CardHeader className={compactHeaderClass}>
          <CardTitle className={compactTitleClass}>COI submissions</CardTitle>
          <CardDescription className="text-xs">
            No certificates uploaded yet. Upload a COI to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={compactCardClass}>
      <CardHeader className={compactHeaderClass}>
        <CardTitle className={compactTitleClass}>COI submissions</CardTitle>
        <CardDescription className="text-xs">
          {documents.length} document{documents.length === 1 ? "" : "s"} in your portfolio
        </CardDescription>
      </CardHeader>
      <CardContent className={`${compactContentClass} overflow-x-auto`}>
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="px-2 py-2 font-medium">File</th>
              <th className="px-2 py-2 font-medium">Status</th>
              <th className="px-2 py-2 font-medium">Size</th>
              <th className="px-2 py-2 font-medium">Uploaded</th>
              <th className="px-2 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id} className="border-b last:border-0">
                <td className="px-2 py-2.5 font-medium">
                  {document.fileName}
                </td>
                <td className="px-2 py-2.5">
                  <StatusBadge
                    status={document.status}
                    label={COI_STATUS_LABELS[document.status]}
                  />
                </td>
                <td className="px-2 py-2.5 text-muted-foreground">
                  {formatBytes(document.fileSizeBytes)}
                </td>
                <td className="px-2 py-2.5 text-muted-foreground">
                  {formatDate(document.createdAt)}
                </td>
                <td className="px-2 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Button asChild variant="outline" size="xs">
                      <Link href={`/dashboard/${document.id}`}>View</Link>
                    </Button>
                    <Button asChild variant="ghost" size="xs">
                      <a
                        href={document.cloudinaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-3" />
                        Open
                      </a>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

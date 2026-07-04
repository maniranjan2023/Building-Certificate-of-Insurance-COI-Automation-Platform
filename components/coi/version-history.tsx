import Link from "next/link";
import type { CoiVersionWithRelations } from "@/lib/services/version";
import { COI_STATUS_LABELS } from "@/lib/services/version-labels";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { VersionBadge } from "@/components/ui/version-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface VersionHistoryProps {
  versions: CoiVersionWithRelations[];
  currentDocumentId: string;
}

export function VersionHistory({
  versions,
  currentDocumentId,
}: VersionHistoryProps) {
  if (versions.length === 0) {
    return null;
  }

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="gap-1 px-4 pb-0">
        <CardTitle className="text-lg">Version history</CardTitle>
        <CardDescription className="text-sm">
          All submissions from {versions[0]?.sender.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4">
        {versions.map((version, index) => {
          const previous = index > 0 ? versions[index - 1] : null;
          const isCurrent = version.coiDocumentId === currentDocumentId;

          return (
            <div
              key={version.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
                isCurrent ? "border-indigo-500/40 bg-indigo-500/5" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <VersionBadge versionNumber={version.versionNumber} />
                <StatusBadge
                  status={version.status}
                  label={COI_STATUS_LABELS[version.status]}
                />
                <span className="text-muted-foreground">
                  {version.coiDocument.fileName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(version.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {!isCurrent ? (
                  <Button asChild variant="outline" size="xs">
                    <Link href={`/dashboard/${version.coiDocumentId}`}>
                      View
                    </Link>
                  </Button>
                ) : (
                  <span className="text-xs text-indigo-400">Current</span>
                )}
                {previous ? (
                  <Button asChild variant="ghost" size="xs">
                    <Link
                      href={`/dashboard/compare?a=${previous.coiDocumentId}&b=${version.coiDocumentId}`}
                    >
                      Compare
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

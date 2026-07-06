import Link from "next/link";
import { GitCompare } from "lucide-react";
import type { CoiVersionWithRelations } from "@/lib/services/version";
import { COI_STATUS_LABELS } from "@/lib/services/version-labels";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { VersionBadge } from "@/components/ui/version-badge";
import { cn } from "@/lib/utils";

interface VersionHistoryProps {
  versions: CoiVersionWithRelations[];
  currentDocumentId: string;
}

export function VersionHistory({
  versions,
  currentDocumentId,
}: VersionHistoryProps) {
  if (versions.length <= 1) {
    return null;
  }

  return (
    <section className="min-w-0 rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Version timeline</h2>
          <p className="text-xs text-muted-foreground">
            {versions.length} submissions from {versions[0]?.sender.email}
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:thin]">
        <div className="flex w-max min-w-full gap-2">
          {versions.map((version, index) => {
            const previous = index > 0 ? versions[index - 1] : null;
            const isCurrent = version.coiDocumentId === currentDocumentId;

            return (
              <div
                key={version.id}
                className={cn(
                  "flex min-w-[11rem] max-w-[14rem] shrink-0 flex-col gap-2 rounded-xl border p-3 text-sm transition-shadow",
                  isCurrent
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "bg-muted/20 hover:border-primary/25 hover:shadow-sm"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <VersionBadge versionNumber={version.versionNumber} />
                  {isCurrent ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Current
                    </span>
                  ) : null}
                </div>

                <StatusBadge
                  status={version.status}
                  label={COI_STATUS_LABELS[version.status]}
                />

                <p className="truncate text-xs text-muted-foreground" title={version.coiDocument.fileName}>
                  {version.coiDocument.fileName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDate(version.createdAt)}
                </p>

                <div className="mt-auto flex gap-1.5">
                  {!isCurrent ? (
                    <Link
                      href={`/dashboard/${version.coiDocumentId}`}
                      className="rounded-md border bg-background px-2 py-1 text-xs font-medium hover:bg-muted"
                    >
                      Open
                    </Link>
                  ) : null}
                  {previous ? (
                    <Link
                      href={`/dashboard/compare?a=${previous.coiDocumentId}&b=${version.coiDocumentId}`}
                      className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs font-medium hover:bg-muted"
                    >
                      <GitCompare className="size-3" />
                      Compare
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

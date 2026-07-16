import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ExpandableText } from "@/components/ui/expandable-text";
import type { ChecklistAgentOutput } from "@/lib/ai/schemas";
import { cn } from "@/lib/utils";

interface ChecklistResultsTableProps {
  checklist: ChecklistAgentOutput;
  className?: string;
  /** Max height for the scrollable body (keeps dashboard from growing endlessly). */
  maxHeightClassName?: string;
}

function statusBadgeClass(status: string): string {
  if (status === "PASS") {
    return "border-emerald-500/30 bg-emerald-500/15 text-emerald-400";
  }
  if (status === "FAIL") {
    return "border-red-500/30 bg-red-500/15 text-red-400";
  }
  return "border-amber-500/30 bg-amber-500/15 text-amber-400";
}

export function ChecklistResultsTable({
  checklist,
  className,
  maxHeightClassName = "max-h-[22rem]",
}: ChecklistResultsTableProps) {
  const passed = checklist.items.filter((item) => item.status === "PASS").length;
  const failed = checklist.items.filter((item) => item.status === "FAIL").length;
  const unclear = checklist.items.length - passed - failed;

  return (
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3 md:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
            <ClipboardList className="size-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold tracking-tight">Checklist results</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {checklist.allPassed
                ? "All checklist items passed"
                : `${checklist.mandatoryFailures.length} mandatory issue(s)`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="rounded-md border bg-muted/40 px-2 py-1 tabular-nums">
            {checklist.items.length} total
          </span>
          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-400 tabular-nums">
            {passed} pass
          </span>
          <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-400 tabular-nums">
            {failed} fail
          </span>
          {unclear > 0 ? (
            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-400 tabular-nums">
              {unclear} other
            </span>
          ) : null}
        </div>
      </div>

      <div className={cn("min-h-0 overflow-auto", maxHeightClassName)}>
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b bg-muted/80 text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
            <tr>
              <th className="px-4 py-2.5 font-medium">#</th>
              <th className="px-4 py-2.5 font-medium">Requirement</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {checklist.items.map((item, index) => (
              <tr
                key={item.checklistItemId}
                className="border-b last:border-0 hover:bg-muted/20"
              >
                <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                  {index + 1}
                </td>
                <td className="max-w-[280px] px-4 py-2.5 font-medium">
                  <ExpandableText
                    text={item.label}
                    title="Requirement"
                    clampClassName="line-clamp-2"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <span className="rounded-md border bg-muted/30 px-2 py-0.5 text-xs">
                    {item.mandatory ? "Mandatory" : "Optional"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant="outline" className={statusBadgeClass(item.status)}>
                    {item.status}
                  </Badge>
                </td>
                <td className="max-w-[360px] px-4 py-2.5 text-muted-foreground">
                  {item.evidence ? (
                    <ExpandableText
                      text={item.evidence}
                      title="Evidence"
                      clampClassName="line-clamp-2"
                    />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function parseChecklistResults(
  value: unknown
): ChecklistAgentOutput | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<ChecklistAgentOutput>;
  if (!Array.isArray(raw.items)) return null;
  return {
    items: raw.items,
    mandatoryFailures: Array.isArray(raw.mandatoryFailures)
      ? raw.mandatoryFailures
      : [],
    allPassed: raw.allPassed ?? false,
  };
}

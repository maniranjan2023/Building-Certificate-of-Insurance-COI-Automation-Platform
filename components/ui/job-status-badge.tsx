import { cn } from "@/lib/utils";
import type { JobStatus } from "@prisma/client";

const jobStatusStyles: Record<JobStatus, string> = {
  QUEUED: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  PROCESSING: "border-violet-500/30 bg-violet-500/10 text-violet-400",
  READY_FOR_REVIEW:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  FAILED: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  DLQ: "border-red-500/30 bg-red-500/10 text-red-400",
};

interface JobStatusBadgeProps {
  status: JobStatus;
  label: string;
  className?: string;
}

export function JobStatusBadge({
  status,
  label,
  className,
}: JobStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        jobStatusStyles[status],
        className
      )}
    >
      {label}
    </span>
  );
}

import { cn } from "@/lib/utils";
import type { CoiStatus } from "@prisma/client";

const statusStyles: Record<CoiStatus, string> = {
  PENDING_REVIEW:
    "border-amber-500/30 bg-amber-500/10 text-amber-400",
  ACCEPTED:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  REJECTED:
    "border-red-500/30 bg-red-500/10 text-red-400",
  EXPIRING_SOON:
    "border-orange-500/30 bg-orange-500/10 text-orange-400",
  EXPIRED:
    "border-muted-foreground/30 bg-muted text-muted-foreground",
};

interface StatusBadgeProps {
  status: CoiStatus;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        statusStyles[status],
        className
      )}
    >
      {label}
    </span>
  );
}

import { cn } from "@/lib/utils";

interface VersionBadgeProps {
  versionNumber: number;
  className?: string;
}

export function VersionBadge({ versionNumber, className }: VersionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400",
        className
      )}
    >
      v{versionNumber}
    </span>
  );
}

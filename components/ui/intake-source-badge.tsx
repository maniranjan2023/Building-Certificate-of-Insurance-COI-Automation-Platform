import { LayoutDashboard, Mail } from "lucide-react";
import type { IntakeSource } from "@prisma/client";
import { INTAKE_SOURCE_LABELS } from "@/lib/constants/intake-source";
import { cn } from "@/lib/utils";

const intakeSourceStyles: Record<IntakeSource, string> = {
  DASHBOARD: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  EMAIL: "border-teal-500/30 bg-teal-500/10 text-teal-400",
};

interface IntakeSourceBadgeProps {
  source: IntakeSource;
  className?: string;
  showIcon?: boolean;
}

export function IntakeSourceBadge({
  source,
  className,
  showIcon = true,
}: IntakeSourceBadgeProps) {
  const Icon = source === "EMAIL" ? Mail : LayoutDashboard;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        intakeSourceStyles[source],
        className
      )}
      title={INTAKE_SOURCE_LABELS[source]}
    >
      {showIcon ? <Icon className="size-3 shrink-0" aria-hidden /> : null}
      {INTAKE_SOURCE_LABELS[source]}
    </span>
  );
}

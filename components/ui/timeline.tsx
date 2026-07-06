"use client";

/**
 * Horizontal step timeline — adapted from 21st.dev (hextaui/timeline, demo id 5157).
 * Supports clickable completed / error steps for pipeline agent output inspection.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertCircle,
  Check,
  Clock,
  Loader2,
  Minus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const timelineVariants = cva("relative flex", {
  variants: {
    variant: {
      default: "gap-4",
      compact: "gap-2",
      spacious: "gap-8",
    },
    orientation: {
      vertical: "flex-col",
      horizontal: "flex-row w-max min-w-full",
    },
  },
  defaultVariants: {
    variant: "default",
    orientation: "horizontal",
  },
});

const timelineItemVariants = cva("relative flex pb-2", {
  variants: {
    orientation: {
      vertical: "flex-row gap-3",
      horizontal: "min-w-[9.5rem] max-w-[11rem] shrink-0 flex-col items-center gap-2 px-1",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

const timelineConnectorVariants = cva("", {
  variants: {
    orientation: {
      vertical: "absolute left-3 top-9 h-full w-px",
      horizontal: "absolute top-3 left-[calc(50%+0.75rem)] h-px w-[calc(100%-1.5rem)]",
    },
    status: {
      default: "bg-border",
      completed: "bg-emerald-500/70",
      active: "bg-sky-500/70",
      pending: "bg-muted-foreground/25",
      error: "bg-destructive/70",
      skipped: "bg-amber-500/50",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    status: "default",
  },
});

const timelineIconVariants = cva(
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-background text-xs font-medium transition-transform",
  {
    variants: {
      status: {
        default: "border-border text-muted-foreground",
        completed:
          "border-emerald-500 bg-emerald-500/15 text-emerald-500 dark:text-emerald-400",
        active:
          "border-sky-500 bg-sky-500/15 text-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.15)] dark:text-sky-400",
        pending: "border-muted-foreground/30 text-muted-foreground",
        error: "border-destructive bg-destructive/15 text-destructive",
        skipped: "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      },
      clickable: {
        true: "cursor-pointer hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        false: "",
      },
    },
    defaultVariants: {
      status: "default",
      clickable: false,
    },
  }
);

export type TimelineStepStatus =
  | "default"
  | "completed"
  | "active"
  | "pending"
  | "error"
  | "skipped";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  status?: TimelineStepStatus;
  icon?: React.ReactNode;
  clickable?: boolean;
  onClick?: () => void;
}

export interface TimelineProps extends VariantProps<typeof timelineVariants> {
  items: TimelineItem[];
  className?: string;
  showConnectors?: boolean;
}

function getStatusIcon(status: TimelineStepStatus | undefined) {
  switch (status) {
    case "completed":
      return <Check className="h-3.5 w-3.5" />;
    case "active":
      return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    case "pending":
      return <Clock className="h-3.5 w-3.5" />;
    case "error":
      return <X className="h-3.5 w-3.5" />;
    case "skipped":
      return <Minus className="h-3.5 w-3.5" />;
    default:
      return <AlertCircle className="h-3 w-3" />;
  }
}

function statusLabel(status: TimelineStepStatus | undefined): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "active":
      return "Running";
    case "pending":
      return "Pending";
    case "error":
      return "Failed";
    case "skipped":
      return "Skipped";
    default:
      return "Waiting";
  }
}

export function Timeline({
  items,
  className,
  variant = "compact",
  orientation = "horizontal",
  showConnectors = true,
}: TimelineProps) {
  const timelineContent = (
    <div className={cn(timelineVariants({ variant, orientation }), className)}>
      {items.map((item, index) => {
        const isClickable = Boolean(item.clickable && item.onClick);
        const icon = (
          <div
            className={cn(
              timelineIconVariants({
                status: item.status,
                clickable: isClickable,
              })
            )}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={isClickable ? item.onClick : undefined}
            onKeyDown={
              isClickable
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      item.onClick?.();
                    }
                  }
                : undefined
            }
            aria-label={
              isClickable
                ? `${item.title} — ${statusLabel(item.status)}. Click to view agent output.`
                : `${item.title} — ${statusLabel(item.status)}`
            }
          >
            {item.icon ?? getStatusIcon(item.status)}
          </div>
        );

        return (
          <div
            key={item.id}
            className={cn(timelineItemVariants({ orientation }), "group")}
          >
            {showConnectors && index < items.length - 1 ? (
              <div
                className={cn(
                  timelineConnectorVariants({
                    orientation,
                    status: item.status === "error" ? "error" : item.status,
                  })
                )}
                aria-hidden="true"
              />
            ) : null}

            <div className="relative z-10 flex shrink-0">{icon}</div>

            <div
              className={cn(
                "flex min-w-0 flex-col gap-1 text-center",
                orientation === "horizontal" ? "w-full" : "flex-1 text-left"
              )}
            >
              <button
                type="button"
                disabled={!isClickable}
                onClick={isClickable ? item.onClick : undefined}
                className={cn(
                  "text-left text-xs font-medium leading-tight",
                  orientation === "horizontal" && "w-full text-center",
                  isClickable
                    ? "cursor-pointer text-foreground underline-offset-2 hover:text-primary hover:underline"
                    : "cursor-default text-foreground"
                )}
              >
                {item.title}
              </button>
              {item.description ? (
                <p className="text-[10px] leading-snug text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              ) : null}
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wide",
                  item.status === "completed" && "text-emerald-500",
                  item.status === "active" && "text-sky-500",
                  item.status === "error" && "text-destructive",
                  item.status === "skipped" && "text-amber-600",
                  item.status === "pending" && "text-muted-foreground"
                )}
              >
                {statusLabel(item.status)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (orientation === "horizontal") {
    return (
      <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-lg pb-2 [scrollbar-width:thin]">
        {timelineContent}
      </div>
    );
  }

  return timelineContent;
}

export {
  timelineVariants,
  timelineItemVariants,
  timelineConnectorVariants,
  timelineIconVariants,
};

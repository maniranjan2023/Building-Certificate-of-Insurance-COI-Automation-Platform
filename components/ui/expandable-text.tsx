"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  text: string;
  /** Dialog title when expanded. */
  title?: string;
  /** Tailwind line-clamp class, e.g. line-clamp-2. */
  clampClassName?: string;
  className?: string;
}

/**
 * Truncates long copy with ellipsis; click opens a dialog with the full sentence.
 */
export function ExpandableText({
  text,
  title = "Full text",
  clampClassName = "line-clamp-2",
  className,
}: ExpandableTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [open, setOpen] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setIsTruncated(el.scrollHeight > el.clientHeight + 1);
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, clampClassName, measure]);

  if (!text) return <span className={className}>—</span>;

  return (
    <>
      <button
        type="button"
        disabled={!isTruncated}
        onClick={() => {
          if (isTruncated) setOpen(true);
        }}
        className={cn(
          "block w-full text-left",
          isTruncated
            ? "cursor-pointer rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            : "cursor-default",
          className
        )}
        title={isTruncated ? "Click to read full text" : undefined}
        aria-label={isTruncated ? `Show full text: ${title}` : undefined}
      >
        <span ref={ref} className={cn("block", clampClassName)}>
          {text}
        </span>
        {isTruncated ? (
          <span className="mt-0.5 inline-block text-[11px] font-medium text-sky-600 dark:text-sky-400">
            View full
          </span>
        ) : null}
      </button>

      <Dialog open={open} onOpenChange={setOpen} modal={false}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="sr-only">
              Full text that was truncated in the list view
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {text}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

import * as React from "react";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.ComponentProps<typeof Loader2Icon> {
  label?: string;
}

/** Animated loading spinner — 21st.dev / coss.com pattern (Loader2 + spin). */
export function Spinner({
  className,
  label = "Loading",
  ...props
}: SpinnerProps) {
  return (
    <Loader2Icon
      role="status"
      aria-label={label}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

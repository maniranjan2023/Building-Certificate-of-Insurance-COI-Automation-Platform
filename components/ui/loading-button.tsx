import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

export interface LoadingButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  spinnerClassName?: string;
}

/** Button with inline spinner while an async action runs — 21st.dev loading-button pattern. */
export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  spinnerClassName,
  asChild = false,
  ...props
}: LoadingButtonProps) {
  if (asChild) {
    return (
      <Button
        asChild
        disabled={disabled || loading}
        className={className}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button
      disabled={disabled || loading}
      className={cn(loading && "relative", className)}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Spinner className={cn("size-4", spinnerClassName)} />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}

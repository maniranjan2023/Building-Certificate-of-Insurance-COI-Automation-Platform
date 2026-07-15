import type { ReactNode } from "react";

interface RouteSkeletonProps {
  /** Optional route name kept for call-site compatibility. */
  name?: string;
  /** Prefer passing a dedicated shadcn page skeleton as children or fixture. */
  fixture?: ReactNode;
  children?: ReactNode;
}

/**
 * Route-level loading UI for Next.js `loading.tsx` files.
 * Renders shadcn Skeleton layouts (no spinner / blank flash).
 */
export function RouteSkeleton({ fixture, children }: RouteSkeletonProps) {
  return (
    <div
      className="min-w-0 animate-in fade-in duration-200 fill-mode-both"
      aria-busy="true"
      aria-label="Loading page"
    >
      {children ?? fixture}
    </div>
  );
}

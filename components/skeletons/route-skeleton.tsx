"use client";

import { Skeleton } from "boneyard-js/react";
import type { ReactNode } from "react";

interface RouteSkeletonProps {
  name: string;
  fixture: ReactNode;
}

/** Route-level loading UI for Next.js `loading.tsx` files. */
export function RouteSkeleton({ name, fixture }: RouteSkeletonProps) {
  return (
    <Skeleton
      name={name}
      loading
      fixture={fixture}
      snapshotConfig={{ leafTags: ["section", "article", "table", "aside"] }}
      fallback={
        <div
          className="pointer-events-none select-none animate-pulse opacity-80"
          aria-busy="true"
          aria-label="Loading page"
        >
          {fixture}
        </div>
      }
    >
      <div className="min-h-[1px]" aria-hidden />
    </Skeleton>
  );
}

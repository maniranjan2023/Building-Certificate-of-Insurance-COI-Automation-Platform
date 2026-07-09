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
          className="min-h-[50vh] animate-pulse rounded-2xl bg-muted/40"
          aria-hidden
        />
      }
    >
      <div className="min-h-[1px]" aria-hidden />
    </Skeleton>
  );
}

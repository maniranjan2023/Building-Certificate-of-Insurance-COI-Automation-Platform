import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { MetricsPageSkeleton } from "@/components/skeletons/shadcn-page-skeletons";

export default function MetricsLoading() {
  return (
    <RouteSkeleton name="metrics">
      <MetricsPageSkeleton />
    </RouteSkeleton>
  );
}

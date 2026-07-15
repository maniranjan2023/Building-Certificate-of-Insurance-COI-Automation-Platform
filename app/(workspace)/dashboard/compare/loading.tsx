import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { ComparePageSkeleton } from "@/components/skeletons/shadcn-page-skeletons";

export default function CompareLoading() {
  return (
    <RouteSkeleton name="dashboard-compare">
      <ComparePageSkeleton />
    </RouteSkeleton>
  );
}

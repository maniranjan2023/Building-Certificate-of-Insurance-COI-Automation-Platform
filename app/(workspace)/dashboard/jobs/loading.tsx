import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { JobsPageSkeleton } from "@/components/skeletons/shadcn-page-skeletons";

export default function JobsLoading() {
  return (
    <RouteSkeleton name="dashboard-jobs">
      <JobsPageSkeleton />
    </RouteSkeleton>
  );
}

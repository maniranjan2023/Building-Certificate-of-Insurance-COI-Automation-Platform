import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { JobsPageFixture } from "@/components/skeletons/fixtures/jobs";

export default function JobsLoading() {
  return <RouteSkeleton name="dashboard-jobs" fixture={<JobsPageFixture />} />;
}

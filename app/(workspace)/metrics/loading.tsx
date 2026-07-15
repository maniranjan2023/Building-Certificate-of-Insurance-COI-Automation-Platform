import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { MetricsPageFixture } from "@/components/skeletons/fixtures/metrics";

export default function MetricsLoading() {
  return <RouteSkeleton name="metrics" fixture={<MetricsPageFixture />} />;
}

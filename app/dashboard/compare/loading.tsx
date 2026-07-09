import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { CompareVersionsFixture } from "@/components/skeletons/fixtures/compare";

export default function CompareLoading() {
  return <RouteSkeleton name="dashboard-compare" fixture={<CompareVersionsFixture />} />;
}

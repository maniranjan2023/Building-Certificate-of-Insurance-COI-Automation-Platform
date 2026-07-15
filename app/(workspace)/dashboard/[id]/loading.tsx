import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { CoiDetailFixture } from "@/components/skeletons/fixtures/coi-detail";

export default function CoiDetailLoading() {
  return <RouteSkeleton name="coi-detail" fixture={<CoiDetailFixture />} />;
}

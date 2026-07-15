import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { ChecklistPageFixture } from "@/components/skeletons/fixtures/checklist";

export default function ChecklistLoading() {
  return <RouteSkeleton name="checklist" fixture={<ChecklistPageFixture />} />;
}

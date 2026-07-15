import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { ChecklistPageSkeleton } from "@/components/skeletons/shadcn-page-skeletons";

export default function ChecklistLoading() {
  return (
    <RouteSkeleton name="checklist">
      <ChecklistPageSkeleton />
    </RouteSkeleton>
  );
}

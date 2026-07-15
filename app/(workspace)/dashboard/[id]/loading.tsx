import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { CoiDetailSkeleton } from "@/components/skeletons/shadcn-page-skeletons";

export default function CoiDetailLoading() {
  return (
    <RouteSkeleton name="coi-detail">
      <CoiDetailSkeleton />
    </RouteSkeleton>
  );
}

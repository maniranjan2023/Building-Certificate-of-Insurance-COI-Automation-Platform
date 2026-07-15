import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { TenantDetailSkeleton } from "@/components/skeletons/shadcn-page-skeletons";

export default function TenantDetailLoading() {
  return (
    <RouteSkeleton name="tenant-detail">
      <TenantDetailSkeleton />
    </RouteSkeleton>
  );
}

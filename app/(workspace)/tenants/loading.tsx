import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { TenantsListSkeleton } from "@/components/skeletons/shadcn-page-skeletons";

export default function TenantsLoading() {
  return (
    <RouteSkeleton name="tenants-list">
      <TenantsListSkeleton />
    </RouteSkeleton>
  );
}

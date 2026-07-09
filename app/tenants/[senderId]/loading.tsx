import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { TenantDetailFixture } from "@/components/skeletons/fixtures/tenant-detail";

export default function TenantDetailLoading() {
  return <RouteSkeleton name="tenant-detail" fixture={<TenantDetailFixture />} />;
}

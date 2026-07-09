import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { TenantsPageFixture } from "@/components/skeletons/fixtures/tenants";

export default function TenantsLoading() {
  return <RouteSkeleton name="tenants-list" fixture={<TenantsPageFixture />} />;
}

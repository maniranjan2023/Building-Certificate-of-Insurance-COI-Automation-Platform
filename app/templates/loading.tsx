import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { TemplatesPageFixture } from "@/components/skeletons/fixtures/templates";

export default function TemplatesLoading() {
  return <RouteSkeleton name="templates" fixture={<TemplatesPageFixture />} />;
}

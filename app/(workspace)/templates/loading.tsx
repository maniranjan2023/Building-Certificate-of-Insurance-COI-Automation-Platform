import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { TemplatesPageSkeleton } from "@/components/skeletons/shadcn-page-skeletons";

export default function TemplatesLoading() {
  return (
    <RouteSkeleton name="templates">
      <TemplatesPageSkeleton />
    </RouteSkeleton>
  );
}

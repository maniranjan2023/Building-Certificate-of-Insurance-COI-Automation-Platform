import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { DocsPageSkeleton } from "@/components/skeletons/shadcn-page-skeletons";

export default function DocsLoading() {
  return (
    <RouteSkeleton name="docs">
      <DocsPageSkeleton />
    </RouteSkeleton>
  );
}

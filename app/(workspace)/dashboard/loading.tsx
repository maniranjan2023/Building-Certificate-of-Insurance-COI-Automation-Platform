import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { DashboardPortfolioSkeleton } from "@/components/skeletons/shadcn-page-skeletons";

export default function DashboardLoading() {
  return (
    <RouteSkeleton name="dashboard-portfolio">
      <DashboardPortfolioSkeleton />
    </RouteSkeleton>
  );
}

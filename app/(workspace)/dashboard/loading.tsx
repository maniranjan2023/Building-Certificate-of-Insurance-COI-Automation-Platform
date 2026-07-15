import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { DashboardPortfolioFixture } from "@/components/skeletons/fixtures/dashboard-portfolio";

export default function DashboardLoading() {
  return <RouteSkeleton name="dashboard-portfolio" fixture={<DashboardPortfolioFixture />} />;
}

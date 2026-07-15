import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import {
  ChecklistPageSkeleton,
  CoiDetailSkeleton,
  ComparePageSkeleton,
  DashboardPortfolioSkeleton,
  JobsPageSkeleton,
  MetricsPageSkeleton,
  TemplatesPageSkeleton,
  TenantDetailSkeleton,
  TenantsListSkeleton,
} from "@/components/skeletons/shadcn-page-skeletons";

/**
 * Renders all route shadcn skeleton layouts for visual review / capture.
 */
export default function BonesCapturePage() {
  return (
    <div className="space-y-10 p-2">
      <RouteSkeleton name="dashboard-portfolio">
        <DashboardPortfolioSkeleton />
      </RouteSkeleton>
      <RouteSkeleton name="dashboard-jobs">
        <JobsPageSkeleton />
      </RouteSkeleton>
      <RouteSkeleton name="coi-detail">
        <CoiDetailSkeleton />
      </RouteSkeleton>
      <RouteSkeleton name="dashboard-compare">
        <ComparePageSkeleton />
      </RouteSkeleton>
      <RouteSkeleton name="tenants-list">
        <TenantsListSkeleton />
      </RouteSkeleton>
      <RouteSkeleton name="tenant-detail">
        <TenantDetailSkeleton />
      </RouteSkeleton>
      <RouteSkeleton name="checklist">
        <ChecklistPageSkeleton />
      </RouteSkeleton>
      <RouteSkeleton name="templates">
        <TemplatesPageSkeleton />
      </RouteSkeleton>
      <RouteSkeleton name="metrics">
        <MetricsPageSkeleton />
      </RouteSkeleton>
    </div>
  );
}

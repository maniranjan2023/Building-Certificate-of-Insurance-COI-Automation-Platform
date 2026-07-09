"use client";

import { RouteSkeleton } from "@/components/skeletons/route-skeleton";
import { DashboardPortfolioFixture } from "@/components/skeletons/fixtures/dashboard-portfolio";
import { JobsPageFixture } from "@/components/skeletons/fixtures/jobs";
import { CoiDetailFixture } from "@/components/skeletons/fixtures/coi-detail";
import { CompareVersionsFixture } from "@/components/skeletons/fixtures/compare";
import { TenantsPageFixture } from "@/components/skeletons/fixtures/tenants";
import { TenantDetailFixture } from "@/components/skeletons/fixtures/tenant-detail";
import { ChecklistPageFixture } from "@/components/skeletons/fixtures/checklist";
import { TemplatesPageFixture } from "@/components/skeletons/fixtures/templates";
import { MetricsPageFixture } from "@/components/skeletons/fixtures/metrics";

/**
 * Renders all route skeleton fixtures for `npx boneyard-js build`.
 * Not linked in navigation — visit only during bones capture.
 * @see docs/SKELETONS.md
 */
export default function BonesCapturePage() {
  return (
    <div className="space-y-16 pb-16" aria-hidden>
      <RouteSkeleton
        name="dashboard-portfolio"
        fixture={<DashboardPortfolioFixture />}
      />
      <RouteSkeleton name="dashboard-jobs" fixture={<JobsPageFixture />} />
      <RouteSkeleton name="coi-detail" fixture={<CoiDetailFixture />} />
      <RouteSkeleton
        name="dashboard-compare"
        fixture={<CompareVersionsFixture />}
      />
      <RouteSkeleton name="tenants-list" fixture={<TenantsPageFixture />} />
      <RouteSkeleton name="tenant-detail" fixture={<TenantDetailFixture />} />
      <RouteSkeleton name="checklist" fixture={<ChecklistPageFixture />} />
      <RouteSkeleton name="templates" fixture={<TemplatesPageFixture />} />
      <RouteSkeleton name="metrics" fixture={<MetricsPageFixture />} />
    </div>
  );
}

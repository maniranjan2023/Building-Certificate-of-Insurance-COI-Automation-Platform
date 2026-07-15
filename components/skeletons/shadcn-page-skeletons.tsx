import { Skeleton } from "@/components/ui/skeleton";

/** Shared header block for route loading UIs. */
function PageHeaderSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-64 max-w-full" />
      <Skeleton className="mt-2 h-4 w-full max-w-xl" />
    </div>
  );
}

function TableRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg border bg-card/60 p-3"
        >
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="ml-auto h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function DashboardPortfolioSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading portfolio">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-2xl border bg-card p-4 shadow-sm">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(280px,340px)_1fr]">
        <aside className="rounded-2xl border bg-card p-5 shadow-sm">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-4 h-28 w-full rounded-xl" />
          <Skeleton className="mt-3 h-9 w-full" />
          <Skeleton className="mt-2 h-9 w-full" />
        </aside>
        <section className="min-w-0 space-y-3 rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <Skeleton className="h-5 w-40" />
          <TableRowsSkeleton rows={4} />
        </section>
      </div>
    </div>
  );
}

export function JobsPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading jobs">
      <PageHeaderSkeleton />
      <QueueMetricsSkeleton />
      <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
        <Skeleton className="mb-4 h-5 w-40" />
        <TableRowsSkeleton rows={4} />
      </section>
      <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
        <Skeleton className="mb-4 h-5 w-36" />
        <TableRowsSkeleton rows={3} />
      </section>
    </div>
  );
}

export function CoiDetailSkeleton() {
  return (
    <div
      className="mx-auto min-w-0 max-w-6xl space-y-6"
      aria-busy="true"
      aria-label="Loading submission"
    >
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <Skeleton className="h-8 w-2/3 max-w-md" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </section>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-1 h-3 w-56" />
          <Skeleton className="mt-4 h-28 w-full rounded-xl" />
          <Skeleton className="mt-3 h-9 w-full" />
        </section>
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-1 h-3 w-48" />
          <Skeleton className="mt-4 aspect-[3/4] w-full rounded-xl" />
        </section>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex items-start gap-3">
              <Skeleton className="size-7 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full max-w-sm" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <Skeleton className="h-5 w-32" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <Skeleton className="h-5 w-40" />
        <TableRowsSkeleton rows={4} />
      </section>
    </div>
  );
}

export function ComparePageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading compare">
      <PageHeaderSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <section key={index} className="rounded-2xl border bg-card p-5 shadow-sm">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 aspect-[3/4] w-full rounded-xl" />
          </section>
        ))}
      </div>
    </div>
  );
}

export function TenantsListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading tenants">
      <PageHeaderSkeleton />
      <Skeleton className="h-9 w-full max-w-md" />
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b bg-muted/40 px-4 py-3">
          <div className="flex gap-8">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="space-y-0 p-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 px-2 py-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="ml-auto h-4 w-24" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function TenantDetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading tenant">
      <PageHeaderSkeleton />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="rounded-xl border bg-card p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-7 w-12" />
          </div>
        ))}
      </div>
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <Skeleton className="mb-4 h-5 w-32" />
        <TableRowsSkeleton rows={6} />
      </section>
    </div>
  );
}

export function ChecklistPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading checklist">
      <PageHeaderSkeleton />
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <TableRowsSkeleton rows={6} />
      </section>
    </div>
  );
}

export function TemplatesPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading templates">
      <PageHeaderSkeleton />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <section key={index} className="rounded-2xl border bg-card p-5 shadow-sm">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-3 h-20 w-full" />
            <Skeleton className="mt-3 h-8 w-24" />
          </section>
        ))}
      </div>
    </div>
  );
}

export function MetricsPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading metrics">
      <PageHeaderSkeleton />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-2xl border bg-card p-4 shadow-sm">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
          </div>
        ))}
      </div>
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-48 w-full rounded-xl" />
      </section>
    </div>
  );
}

export function QueueMetricsSkeleton() {
  return (
    <section
      className="rounded-2xl border bg-card p-4 shadow-sm md:p-5"
      aria-busy="true"
      aria-label="Loading queue metrics"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-xl border bg-muted/20 p-3">
            <Skeleton className="h-3 w-24" />
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CronScanSkeleton() {
  return (
    <section
      className="rounded-2xl border bg-card p-4 shadow-sm md:p-5"
      aria-busy="true"
      aria-label="Loading cron scans"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-lg border p-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="ml-auto h-4 w-14" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Pick the matching shadcn page skeleton for a workspace href. */
export function resolveShadcnPageSkeleton(href: string) {
  if (href.startsWith("/dashboard/jobs")) return <JobsPageSkeleton />;
  if (href.startsWith("/dashboard/compare")) return <ComparePageSkeleton />;
  if (/^\/dashboard\/[^/]+$/.test(href)) return <CoiDetailSkeleton />;
  if (href === "/dashboard") return <DashboardPortfolioSkeleton />;
  if (/^\/tenants\/[^/]+$/.test(href)) return <TenantDetailSkeleton />;
  if (href.startsWith("/tenants")) return <TenantsListSkeleton />;
  if (href.startsWith("/checklist")) return <ChecklistPageSkeleton />;
  if (href.startsWith("/templates")) return <TemplatesPageSkeleton />;
  if (href.startsWith("/metrics")) return <MetricsPageSkeleton />;
  return <DashboardPortfolioSkeleton />;
}

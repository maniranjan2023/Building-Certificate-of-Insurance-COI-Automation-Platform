import { PortfolioHero } from "@/components/dashboard/portfolio-hero";
import { CoiUploadForm } from "@/components/coi/coi-upload-form";
import type { PortfolioStats } from "@/lib/services/dashboard-stats";

const MOCK_STATS: PortfolioStats = {
  total: 12,
  pendingReview: 3,
  accepted: 7,
  rejected: 1,
  processing: 2,
  readyForReview: 3,
  failedJobs: 0,
  uniqueTenants: 5,
};

export function DashboardPortfolioFixture() {
  return (
    <div className="space-y-6">
      <PortfolioHero stats={MOCK_STATS} />
      <div className="grid gap-6 xl:grid-cols-[minmax(280px,340px)_1fr]">
        <aside className="xl:sticky xl:top-20 xl:self-start">
          <CoiUploadForm />
        </aside>
        <section className="min-w-0 space-y-3 rounded-2xl border bg-card/60 p-5 shadow-sm backdrop-blur-sm md:p-6">
          {[1, 2, 3].map((row) => (
            <article
              key={row}
              className="rounded-xl border bg-card/80 p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded bg-muted" />
                  <div className="h-3 w-32 rounded bg-muted/70" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-16 rounded-md bg-muted" />
                  <div className="h-8 w-16 rounded-md bg-muted/70" />
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

import type { PlatformMetrics } from "@/lib/services/metrics";
import {
  BarChart3,
  Clock,
  DollarSign,
  Mail,
  Percent,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";

interface MetricsDashboardProps {
  metrics: PlatformMetrics;
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-background/70 p-4 backdrop-blur-sm">
      <div
        aria-hidden
        className={`absolute inset-0 bg-linear-to-br opacity-60 ${accent}`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div className="rounded-lg border bg-background/80 p-2 shadow-sm">
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

export function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  const { portfolio, compliance, automation, turnaround, roi, reminders } = metrics;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_-10%,oklch(0.62_0.19_255/0.18),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_0%,oklch(0.72_0.14_280/0.12),transparent_50%)]"
        />
        <div className="relative p-5 md:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <BarChart3 className="size-3.5" />
            Portfolio health
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
            {compliance.compliancePercent}% compliant
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Live compliance, automation, and ROI metrics calculated from your Neon
            portfolio. Updated {new Date(metrics.generatedAt).toLocaleString()}.
          </p>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Compliance"
          value={`${compliance.compliancePercent}%`}
          hint={compliance.definition}
          icon={ShieldCheck}
          accent="from-emerald-500/20 to-green-600/5"
        />
        <MetricCard
          label="Automation"
          value={`${automation.automationPercent}%`}
          hint={`${automation.aiProcessedCount} of ${automation.totalWithVersions} AI-processed`}
          icon={Sparkles}
          accent="from-violet-500/20 to-purple-600/5"
        />
        <MetricCard
          label="Expiring soon"
          value={String(portfolio.expiringSoon)}
          hint="Within 30-day reminder window"
          icon={Timer}
          accent="from-amber-500/20 to-orange-600/5"
        />
        <MetricCard
          label="Reminders sent"
          value={String(reminders.totalSent)}
          hint={
            reminders.lastSentAt
              ? `Last sent ${new Date(reminders.lastSentAt).toLocaleDateString()}`
              : "No renewal reminders yet"
          }
          icon={Mail}
          accent="from-sky-500/20 to-blue-600/5"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="size-4 text-primary" />
            Turnaround
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4 border-b pb-3">
              <dt className="text-muted-foreground">Avg agent response</dt>
              <dd className="font-medium tabular-nums">
                {turnaround.avgAgentResponseHours != null
                  ? `${turnaround.avgAgentResponseHours}h`
                  : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b pb-3">
              <dt className="text-muted-foreground">Avg resolution time</dt>
              <dd className="font-medium tabular-nums">
                {turnaround.avgComplianceResolutionDays != null
                  ? `${turnaround.avgComplianceResolutionDays} days`
                  : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Samples</dt>
              <dd className="text-xs text-muted-foreground">
                {turnaround.samplesAgentResponse} AI runs ·{" "}
                {turnaround.samplesComplianceResolution} acceptances
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <DollarSign className="size-4 text-primary" />
            ROI & savings
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4 border-b pb-3">
              <dt className="text-muted-foreground">Hours saved</dt>
              <dd className="font-medium tabular-nums">{roi.hoursSaved}h</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b pb-3">
              <dt className="text-muted-foreground">Working days saved</dt>
              <dd className="font-medium tabular-nums">{roi.workingDaysSaved}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b pb-3">
              <dt className="text-muted-foreground">Cost savings</dt>
              <dd className="font-medium tabular-nums">
                ${roi.costSavingsUsd.toLocaleString()}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">ROI</dt>
              <dd className="flex items-center gap-1 font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                <Percent className="size-3.5" />
                {roi.roiPercent}%
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Based on {roi.manualReviewMinutes} min manual review @ ${roi.hourlyRateUsd}/hr
            vs ${roi.platformCostAnnualUsd.toLocaleString()}/yr platform cost.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <h3 className="text-lg font-semibold">Portfolio breakdown</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Active COIs", portfolio.activeCois],
            ["Accepted active", portfolio.acceptedActive],
            ["Expired", portfolio.expired],
            ["Pending review", portfolio.pendingReview],
            ["Rejected", portfolio.rejected],
            ["Total submissions", portfolio.totalSubmissions],
            ["Unique tenants", portfolio.uniqueTenants],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border bg-muted/20 px-3 py-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

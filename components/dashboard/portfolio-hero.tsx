import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileStack,
  Sparkles,
  Users,
} from "lucide-react";
import type { PortfolioStats } from "@/lib/services/dashboard-stats";

interface PortfolioHeroProps {
  stats: PortfolioStats;
}

const STAT_ITEMS = [
  {
    key: "total" as const,
    label: "Total submissions",
    icon: FileStack,
    accent: "from-sky-500/20 to-blue-600/5 text-sky-600 dark:text-sky-400",
  },
  {
    key: "readyForReview" as const,
    label: "Ready for review",
    icon: Sparkles,
    accent: "from-violet-500/20 to-purple-600/5 text-violet-600 dark:text-violet-400",
  },
  {
    key: "accepted" as const,
    label: "Accepted",
    icon: CheckCircle2,
    accent: "from-emerald-500/20 to-green-600/5 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "uniqueTenants" as const,
    label: "Active tenants",
    icon: Users,
    accent: "from-amber-500/20 to-orange-600/5 text-amber-600 dark:text-amber-400",
  },
];

export function PortfolioHero({ stats }: PortfolioHeroProps) {
  const headline =
    stats.total === 0
      ? "Your COI portfolio is ready"
      : stats.readyForReview > 0
        ? `${stats.readyForReview} submission${stats.readyForReview === 1 ? "" : "s"} awaiting review`
        : `${stats.total} certificate${stats.total === 1 ? "" : "s"} tracked`;

  return (
    <section className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_-10%,oklch(0.62_0.19_255/0.18),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_0%,oklch(0.72_0.14_280/0.12),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 left-1/3 size-48 rounded-full bg-violet-500/10 blur-3xl"
      />

      <div className="relative p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              AI-powered compliance workspace
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {headline}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                Upload tenant certificates, track versions automatically, and let the
                agent pipeline validate coverage — all in one portfolio view.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/tenants"
                className="inline-flex items-center gap-1.5 rounded-lg border bg-background/80 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition-colors hover:bg-background"
              >
                Tenant activity
                <ArrowUpRight className="size-3.5 opacity-60" />
              </Link>
              <Link
                href="/dashboard/jobs"
                className="inline-flex items-center gap-1.5 rounded-lg border bg-background/80 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition-colors hover:bg-background"
              >
                Job queue
                <ArrowUpRight className="size-3.5 opacity-60" />
              </Link>
            </div>
          </div>

          {stats.processing > 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              <Clock className="size-4 shrink-0 animate-pulse" />
              {stats.processing} processing in background
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STAT_ITEMS.map((item) => {
            const Icon = item.icon;
            const value = stats[item.key];

            return (
              <div
                key={item.key}
                className="group relative overflow-hidden rounded-xl border bg-background/70 p-4 backdrop-blur-sm transition-shadow hover:shadow-md"
              >
                <div
                  aria-hidden
                  className={`absolute inset-0 bg-linear-to-br opacity-60 ${item.accent.split(" ").slice(0, 2).join(" ")}`}
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
                      {value}
                    </p>
                  </div>
                  <div
                    className={`rounded-lg border bg-background/80 p-2 shadow-sm ${item.accent.split(" ").slice(2).join(" ")}`}
                  >
                    <Icon className="size-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

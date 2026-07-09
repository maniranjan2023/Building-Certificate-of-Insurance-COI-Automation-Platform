import {
  AlertTriangle,
  Clock,
  FileWarning,
  Inbox,
  Scale,
  TrendingDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LandingMotionSection } from "@/components/marketing/landing-motion-section";
import { glassBadge, glassCard } from "@/components/marketing/glass-styles";
import { cn } from "@/lib/utils";

const PAINS = [
  {
    icon: Inbox,
    title: "COIs lost in email threads",
    description:
      "Every tenant sends a different PDF to a shared inbox. Nobody knows which properties are compliant right now.",
    accent: "text-sky-400",
  },
  {
    icon: Clock,
    title: "20+ minutes per certificate",
    description:
      "Staff open each PDF by hand, hunt for limits and endorsements, and compare against lease requirements from memory.",
    accent: "text-amber-400",
  },
  {
    icon: FileWarning,
    title: "Vague rejections, endless resubmits",
    description:
      "Tenants get a generic “not acceptable” email with no specifics — so they fix the wrong thing and send it again.",
    accent: "text-rose-400",
  },
  {
    icon: TrendingDown,
    title: "Coverage lapses in silence",
    description:
      "Renewal dates live in someone’s calendar — until they don’t. Properties operate uninsured until an incident exposes the gap.",
    accent: "text-violet-400",
  },
  {
    icon: Scale,
    title: "No defensible audit trail",
    description:
      "Who approved what, when, and why? Decisions buried in email make lender reviews and legal disputes painful to defend.",
    accent: "text-emerald-400",
  },
  {
    icon: AlertTriangle,
    title: "One missed clause, massive liability",
    description:
      "Missing additional insured or sub-minimum limits can cost more than a year of management fees — on a single tenant.",
    accent: "text-primary",
  },
];

export function LandingProblem() {
  return (
    <section id="problem" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingMotionSection className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className={cn("mb-4 px-3 py-1", glassBadge)}>
            The problem
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
            COI compliance is mandatory —{" "}
            <span className="text-muted-foreground">but manual review was never built to scale</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Every lease requires proof of insurance. Every insurer formats it differently.
            Property teams are still reviewing PDFs one at a time while portfolios grow.
          </p>
        </LandingMotionSection>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PAINS.map((pain, index) => {
            const Icon = pain.icon;
            return (
              <LandingMotionSection key={pain.title} delay={index * 0.05}>
                <Card className={cn("h-full border-0 bg-transparent shadow-none", glassCard)}>
                  <CardHeader className="gap-3">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-md",
                        pain.accent
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-base leading-snug">{pain.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {pain.description}
                    </p>
                  </CardContent>
                </Card>
              </LandingMotionSection>
            );
          })}
        </div>

        <LandingMotionSection
          delay={0.15}
          className={cn(
            "mx-auto mt-12 max-w-3xl rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-5 text-center backdrop-blur-md",
            "ring-1 ring-inset ring-amber-500/20"
          )}
        >
          <p className="text-sm font-medium text-amber-200 sm:text-base">
            Spreadsheets and shared inboxes don&apos;t fail because teams are careless — they fail
            because the process was never designed for 50, 200, or 500 units.
          </p>
        </LandingMotionSection>
      </div>
    </section>
  );
}

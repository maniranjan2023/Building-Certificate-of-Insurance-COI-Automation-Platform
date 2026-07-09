import {
  BarChart3,
  ClipboardCheck,
  GitCompare,
  History,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LandingMotionSection } from "@/components/marketing/landing-motion-section";
import { glassBadge, glassCard } from "@/components/marketing/glass-styles";
import { cn } from "@/lib/utils";

const BENEFITS = [
  {
    icon: Mail,
    title: "Email-native intake",
    description:
      "Tenants send COIs the way they already do — you get structured compliance records instead of attachment chaos.",
    accent: "text-sky-400",
  },
  {
    icon: ClipboardCheck,
    title: "Your rules, enforced consistently",
    description:
      "Set liability minimums, required endorsements, and mandatory clauses once — applied to every submission automatically.",
    accent: "text-emerald-400",
  },
  {
    icon: ShieldCheck,
    title: "Safe, approved tenant messaging",
    description:
      "Outbound emails are drafted for you and reviewed by your team before send — professional, specific, and on-brand.",
    accent: "text-violet-400",
  },
  {
    icon: GitCompare,
    title: "Version history on resubmits",
    description:
      "When a tenant fixes and resends, you see what changed from v1 to v2 — no more treating every email as brand new.",
    accent: "text-amber-400",
  },
  {
    icon: History,
    title: "Complete activity timeline",
    description:
      "Every upload, review, decision, and email in one audit-ready history per tenant and per property.",
    accent: "text-rose-400",
  },
  {
    icon: BarChart3,
    title: "Portfolio metrics & ROI",
    description:
      "See compliance health, processing turnaround, and time saved — quantify the value of automation to stakeholders.",
    accent: "text-primary",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingMotionSection className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className={cn("mb-4 px-3 py-1", glassBadge)}>
            What you get
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything compliance teams need — nothing they don&apos;t
          </h2>
          <p className="mt-4 text-muted-foreground">
            Outcomes that matter to property operations: visibility, consistency, speed, and
            defensible records.
          </p>
        </LandingMotionSection>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <LandingMotionSection key={benefit.title} delay={index * 0.04}>
                <Card className={cn("h-full border-0 bg-transparent shadow-none", glassCard)}>
                  <CardHeader className="gap-3">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-md",
                        benefit.accent
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-base">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </LandingMotionSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}

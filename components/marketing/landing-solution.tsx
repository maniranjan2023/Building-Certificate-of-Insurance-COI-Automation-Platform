import { Bell, CheckCircle2, LayoutDashboard, MessageSquare, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LandingMotionSection } from "@/components/marketing/landing-motion-section";
import { glassBadge, glassSection, glassStat } from "@/components/marketing/glass-styles";
import { cn } from "@/lib/utils";

const PILLARS = [
  {
    icon: LayoutDashboard,
    title: "Centralize every submission",
    description:
      "Tenants email COIs or your team uploads from the dashboard. Every document lands in one compliance workspace — linked to the right property and tenant.",
  },
  {
    icon: Shield,
    title: "Validate against your standards",
    description:
      "AI reads each certificate, checks your requirements — limits, additional insured, endorsements, expiry — and flags exactly what passes or fails.",
  },
  {
    icon: MessageSquare,
    title: "Communicate with clarity",
    description:
      "When something is wrong, tenants get specific feedback — not a vague rejection. Your team approves every outbound message before it sends.",
  },
  {
    icon: Bell,
    title: "Never miss a renewal",
    description:
      "Expiration dates are tracked automatically. Proactive reminders go out before coverage lapses — so you’re never surprised at move-in or audit time.",
  },
];

const OUTCOMES = [
  { value: "70%+", label: "Less time spent per COI vs manual PDF review" },
  { value: "100%", label: "Portfolio visibility — who’s compliant, who’s not" },
  { value: "0", label: "Silent auto-approvals — your team always decides" },
  { value: "Full", label: "Audit trail for every decision and tenant message" },
];

export function LandingSolution() {
  return (
    <section id="solution" className={cn("py-20 sm:py-28", glassSection)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingMotionSection className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className={cn("mb-4 px-3 py-1 text-primary", glassBadge)}>
            The solution
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
            Replace inbox chaos with{" "}
            <span className="bg-linear-to-r from-primary via-violet-400 to-sky-400 bg-clip-text text-transparent">
              portfolio-wide COI confidence
            </span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            COI Platform turns scattered PDFs into a repeatable compliance workflow — intake,
            validation, human approval, and tenant communication in one place.
          </p>
        </LandingMotionSection>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {PILLARS.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <LandingMotionSection key={pillar.title} delay={index * 0.06}>
                <Card className={cn("h-full border-0 bg-transparent shadow-none", glassStat)}>
                  <CardContent className="flex gap-4 p-6">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{pillar.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {pillar.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </LandingMotionSection>
            );
          })}
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {OUTCOMES.map((outcome, index) => (
            <LandingMotionSection key={outcome.label} delay={index * 0.05}>
              <div className={cn("p-6 text-center sm:text-left", glassStat)}>
                <p className="text-3xl font-semibold tracking-tight text-primary">
                  {outcome.value}
                </p>
                <p className="mt-2 text-sm leading-snug text-muted-foreground">{outcome.label}</p>
              </div>
            </LandingMotionSection>
          ))}
        </div>

        <LandingMotionSection
          delay={0.1}
          className="mx-auto mt-12 flex max-w-2xl items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-4 backdrop-blur-md ring-1 ring-inset ring-emerald-500/15"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
          <p className="text-sm leading-relaxed text-emerald-100/90">
            <span className="font-medium text-emerald-200">Human-in-the-loop by design.</span>{" "}
            AI recommends and drafts — your compliance team accepts, rejects, or edits before
            anything reaches a tenant.
          </p>
        </LandingMotionSection>
      </div>
    </section>
  );
}

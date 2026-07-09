"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";
import { LandingMotionSection } from "@/components/marketing/landing-motion-section";
import { glassBadge, glassPanel } from "@/components/marketing/glass-styles";
import { cn } from "@/lib/utils";

const STEPS: TimelineItem[] = [
  {
    id: "intake",
    title: "Tenant submits",
    description: "Email or dashboard upload — every COI is captured and linked to the right lease.",
    status: "completed",
  },
  {
    id: "review",
    title: "Instant validation",
    description: "Coverage limits, dates, and endorsements checked against your requirements.",
    status: "completed",
  },
  {
    id: "decide",
    title: "Your team decides",
    description: "Accept, reject, or request fixes — with a draft message ready to send.",
    status: "active",
  },
  {
    id: "renew",
    title: "Stay ahead of expiry",
    description: "Automated renewal reminders before policies lapse across the portfolio.",
    status: "pending",
  },
];

const STEP_DETAILS = [
  {
    title: "One intake path for every tenant",
    body: "No more hunting through inboxes. Submissions arrive in a single compliance queue with the tenant, property, and version already attached.",
  },
  {
    title: "Consistent standards, every time",
    body: "The same checklist applies to every COI — whether it’s a move-in, renewal, or resubmission after a rejection.",
  },
  {
    title: "Clear communication, fewer cycles",
    body: "Tenants know exactly what to fix. Your team reviews the message before it goes out — no more vague “please resubmit” loops.",
  },
  {
    title: "Compliance you can prove",
    body: "Every upload, review, decision, and outbound message is recorded — ready for audits, lenders, and internal reporting.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingMotionSection className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className={cn("mb-4 px-3 py-1", glassBadge)}>
            How it works
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            From submission to approved COI — without the manual grind
          </h2>
          <p className="mt-4 text-muted-foreground">
            A simple workflow your team already understands — powered by automation where it
            matters most.
          </p>
        </LandingMotionSection>

        <LandingMotionSection delay={0.08} className="mt-12">
          <div className={cn("p-6 sm:p-8", glassPanel)}>
            <Timeline items={STEPS} variant="spacious" orientation="horizontal" />
          </div>
        </LandingMotionSection>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {STEP_DETAILS.map((detail, index) => (
            <LandingMotionSection key={detail.title} delay={index * 0.05}>
              <Card className={cn("h-full border-0 bg-transparent shadow-none", glassPanel)}>
                <CardContent className="p-6">
                  <h3 className="font-semibold">{detail.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {detail.body}
                  </p>
                </CardContent>
              </Card>
            </LandingMotionSection>
          ))}
        </div>
      </div>
    </section>
  );
}

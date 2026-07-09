import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LandingMotionSection } from "@/components/marketing/landing-motion-section";
import { glassCard, glassSection } from "@/components/marketing/glass-styles";
import { cn } from "@/lib/utils";

const INCLUDED = [
  "Unlimited COI submissions across your portfolio",
  "Automated intake from email and dashboard upload",
  "AI-powered compliance validation against your checklist",
  "Human-approved tenant communication",
  "Renewal reminders before policies expire",
  "Full audit trail and tenant activity history",
];

export function LandingPricing() {
  return (
    <section className={cn("py-20 sm:py-28", glassSection)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingMotionSection className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Pricing</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for teams outgrowing manual COI review
          </h2>
          <p className="mt-4 text-muted-foreground">
            Early access for property managers and asset operators who need compliance at scale —
            not another spreadsheet.
          </p>
        </LandingMotionSection>

        <LandingMotionSection delay={0.08}>
          <Card
            className={cn(
              "mx-auto mt-12 max-w-lg border-0 bg-transparent shadow-none",
              glassCard,
              "border-primary/25"
            )}
          >
            <CardHeader className="text-center">
              <p className="text-sm font-medium text-primary">Pilot program</p>
              <CardTitle className="mt-2 text-4xl font-semibold">
                Custom
                <span className="text-lg font-normal text-muted-foreground"> / portfolio</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Sized to your unit count and compliance volume
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full" size="lg">
                <Link href="/login">Request early access</Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Sign in with your admin credentials or contact us for a demo workspace.
              </p>
            </CardContent>
          </Card>
        </LandingMotionSection>
      </div>
    </section>
  );
}

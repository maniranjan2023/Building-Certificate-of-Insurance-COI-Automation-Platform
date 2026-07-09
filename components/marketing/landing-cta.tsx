import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCT_NAME } from "@/lib/navigation";
import { LandingMotionSection } from "@/components/marketing/landing-motion-section";
import { glassBar, glassCta, glassIcon } from "@/components/marketing/glass-styles";
import { cn } from "@/lib/utils";

interface LandingCtaProps {
  isAuthenticated: boolean;
}

export function LandingCta({ isAuthenticated }: LandingCtaProps) {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingMotionSection>
          <div className={cn("relative overflow-hidden px-6 py-16 text-center sm:px-12", glassCta)}>
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
            />
            <div className="relative mx-auto max-w-2xl">
              <div
                className={cn(
                  "mx-auto mb-6 flex size-12 items-center justify-center text-primary-foreground",
                  glassIcon,
                  "bg-primary/90 ring-primary/30"
                )}
              >
                <Shield className="size-6" />
              </div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Your portfolio deserves better than inbox roulette
              </h2>
              <p className="mt-4 text-muted-foreground">
                Join property teams replacing manual PDF review with centralized compliance,
                consistent validation, and clear tenant communication.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-11 px-6">
                  <Link href={isAuthenticated ? "/dashboard" : "/login"}>
                    {isAuthenticated ? "Open dashboard" : "Get started"}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </LandingMotionSection>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className={cn("border-t py-12", glassBar)}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="size-4 text-primary" />
          <span>{PRODUCT_NAME}</span>
          <span aria-hidden>·</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <a href="#problem" className="hover:text-foreground">
            Problem
          </a>
          <a href="#solution" className="hover:text-foreground">
            Solution
          </a>
          <a href="#how-it-works" className="hover:text-foreground">
            How it works
          </a>
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}

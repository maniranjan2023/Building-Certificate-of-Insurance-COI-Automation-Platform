import { LandingCta, LandingFooter } from "@/components/marketing/landing-cta";
import { LandingFaq } from "@/components/marketing/landing-faq";
import { LandingFeatures } from "@/components/marketing/landing-features";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingHowItWorks } from "@/components/marketing/landing-how-it-works";
import { LandingLogos } from "@/components/marketing/landing-logos";
import { LandingNav } from "@/components/marketing/landing-nav";
import { LandingProblem } from "@/components/marketing/landing-problem";
import { LandingPricing } from "@/components/marketing/landing-pricing";
import { LandingSolution } from "@/components/marketing/landing-solution";
import { LandingBackground } from "@/components/marketing/landing-background";

interface LandingPageProps {
  isAuthenticated: boolean;
}

export function LandingPage({ isAuthenticated }: LandingPageProps) {
  return (
    <div className="relative min-h-screen text-foreground">
      <LandingBackground />
      <div className="relative z-10">
        <LandingNav isAuthenticated={isAuthenticated} />
        <main>
          <LandingHero />
          <LandingLogos />
          <LandingProblem />
          <LandingSolution />
          <LandingHowItWorks />
          <LandingFeatures />
          <LandingPricing />
          <LandingFaq />
          <LandingCta isAuthenticated={isAuthenticated} />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}

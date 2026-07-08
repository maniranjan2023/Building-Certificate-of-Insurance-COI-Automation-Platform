import { LandingCta, LandingFooter } from "@/components/marketing/landing-cta";
import { LandingFaq } from "@/components/marketing/landing-faq";
import { LandingFeatures } from "@/components/marketing/landing-features";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingHowItWorks } from "@/components/marketing/landing-how-it-works";
import { LandingLogos } from "@/components/marketing/landing-logos";
import { LandingNav } from "@/components/marketing/landing-nav";
import { LandingPipeline } from "@/components/marketing/landing-pipeline";
import { LandingPricing } from "@/components/marketing/landing-pricing";
import { LandingBackground } from "@/components/marketing/landing-background";

interface LandingPageProps {
  isAuthenticated: boolean;
}

export function LandingPage({
  isAuthenticated,
}: LandingPageProps) {
  return (
    <div className="relative min-h-screen text-foreground">
      <LandingBackground />
      <div className="relative z-10">
        <LandingNav isAuthenticated={isAuthenticated} />
        <main>
          <LandingHero />
          <LandingLogos />
          <LandingFeatures />
          <LandingHowItWorks />
          <LandingPipeline />
          <LandingPricing />
          <LandingFaq />
          <LandingCta isAuthenticated={isAuthenticated} />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}

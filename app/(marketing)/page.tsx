import { getSession } from "@/lib/auth";
import { LandingPage } from "@/components/marketing/landing-page";

export default async function MarketingHomePage() {
  const session = await getSession();

  return (
    <LandingPage isAuthenticated={Boolean(session)} />
  );
}

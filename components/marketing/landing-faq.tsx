import { LandingMotionSection } from "@/components/marketing/landing-motion-section";
import { glassPanel } from "@/components/marketing/glass-styles";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    question: "What is a Certificate of Insurance (COI)?",
    answer:
      "A COI is proof that a tenant carries active liability coverage and names the landlord as additional insured. It's required at move-in and every renewal — but every insurer formats it differently, which makes manual review slow and error-prone.",
  },
  {
    question: "Does the platform auto-approve COIs?",
    answer:
      "No. The system validates and drafts recommendations, but your compliance team always makes the final accept, reject, or send decision. Nothing goes to a tenant without your approval.",
  },
  {
    question: "How do tenants submit their COIs?",
    answer:
      "Tenants can email PDFs to your dedicated intake address or your team can upload directly from the dashboard. Either way, every submission is tracked in one compliance workspace.",
  },
  {
    question: "What happens when a COI doesn't meet requirements?",
    answer:
      "The platform identifies exactly which limits, dates, or endorsements are missing or insufficient. Your team reviews a clear draft message explaining what the tenant needs to fix — reducing back-and-forth resubmits.",
  },
  {
    question: "Can we prove compliance during an audit?",
    answer:
      "Yes. Every submission, review, decision, and tenant message is logged with timestamps. Export a full audit record per property or tenant when lenders, HOAs, or legal teams need documentation.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <LandingMotionSection className="text-center">
          <p className="text-sm font-medium text-primary">FAQ</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions property teams ask
          </h2>
        </LandingMotionSection>

        <dl className="mt-12 space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <LandingMotionSection key={item.question} delay={index * 0.04}>
              <div className={cn("p-6", glassPanel)}>
                <dt className="font-medium">{item.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </dd>
              </div>
            </LandingMotionSection>
          ))}
        </dl>
      </div>
    </section>
  );
}

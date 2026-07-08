import { glassPanel } from "@/components/marketing/glass-styles";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    question: "What is a Certificate of Insurance (COI)?",
    answer:
      "A COI is a one-page summary proving a tenant carries active liability coverage and names the landlord as additional insured. It's required at move-in and every renewal — but every insurer formats it differently.",
  },
  {
    question: "Does the AI auto-approve COIs?",
    answer:
      "No. AI produces a draft report and suggested email, but an admin must Accept, Reject, or Send. Acceptance is blocked until mandatory checklist items pass and expiration dates are valid.",
  },
  {
    question: "How do tenants submit COIs?",
    answer:
      "Tenants email PDF attachments to your AgentMail inbox, or admins upload directly from the dashboard. Both paths enqueue the same AI processing pipeline.",
  },
  {
    question: "What happens when a COI fails compliance?",
    answer:
      "The checklist agent marks items as FAIL or MISSING. The report agent drafts a specific tenant email listing what's wrong. Admins review and send a templated Clauses Missing notification.",
  },
  {
    question: "Is there an audit trail?",
    answer:
      "Yes. Every AI agent step, outbound email, version change, and admin decision is logged. Tenant Activity gives a full timeline per sender.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-medium text-primary">FAQ</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Common questions
          </h2>
        </div>

        <dl className="mt-12 space-y-6">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question} className={cn("p-6", glassPanel)}>
              <dt className="font-medium">{item.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

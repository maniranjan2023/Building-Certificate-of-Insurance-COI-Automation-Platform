import { glassPanel, glassSection } from "@/components/marketing/glass-styles";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    step: "01",
    title: "Intake",
    description:
      "Tenant emails a COI PDF or admin uploads from the dashboard. File lands in Cloudinary, a job hits the BullMQ queue, and a receipt email goes out automatically.",
  },
  {
    step: "02",
    title: "AI processing",
    description:
      "The worker runs OCR, then five agents in sequence: classify → extract → checklist → risk → report. Results and citations land on the COI detail page.",
  },
  {
    step: "03",
    title: "Admin review",
    description:
      "Edit the draft report, adjust citations, then Accept, Reject, or Send a custom email. Acceptance gates block approval until mandatory checklist items pass.",
  },
  {
    step: "04",
    title: "Tenant reply",
    description:
      "Templated outbound emails render from your template library, pass a final guardrail, and send via AgentMail — with a full OutboundEmail audit record.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className={cn("py-20 sm:py-28", glassSection)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            From inbox to approved COI in four steps
          </h2>
          <p className="mt-4 text-muted-foreground">
            Human-in-the-loop by design — AI recommends, your team decides.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item) => (
            <div key={item.step} className={cn("relative p-6", glassPanel)}>
              <span className="text-3xl font-semibold tabular-nums text-primary/40">
                {item.step}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

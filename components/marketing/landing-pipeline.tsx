import { glassRow, glassStat } from "@/components/marketing/glass-styles";
import { cn } from "@/lib/utils";

const AGENTS = [
  { name: "Document", role: "Is this a COI?" },
  { name: "Extraction", role: "Carrier, limits, dates" },
  { name: "Checklist", role: "PASS / FAIL / MISSING" },
  { name: "Risk", role: "Mandatory failures" },
  { name: "Report", role: "Draft + citations" },
];

const STATS = [
  { value: "70%+", label: "Review time reduction vs manual PDF review" },
  { value: "5", label: "Specialized AI agents in sequence" },
  { value: "100%", label: "Outbound emails audited & guardrailed" },
  { value: "0", label: "Auto-accept without admin approval" },
];

export function LandingPipeline() {
  return (
    <section id="pipeline" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-medium text-primary">AI pipeline</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Five agents. One compliance verdict.
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Each agent has a single job. Output from one step becomes structured
              input for the next — no shared LLM memory, full audit trail in
              Postgres. Groq powers inference; guardrails stop bad outputs before
              they reach your tenants.
            </p>

            <div className="mt-8 space-y-3">
              {AGENTS.map((agent, index) => (
                <div key={agent.name} className={cn("flex items-center gap-4 px-4 py-3", glassRow)}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-semibold text-primary backdrop-blur-md ring-1 ring-inset ring-white/10">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{agent.name} Agent</p>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className={cn("p-6", glassStat)}>
                <p className="text-3xl font-semibold tracking-tight text-primary">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm leading-snug text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

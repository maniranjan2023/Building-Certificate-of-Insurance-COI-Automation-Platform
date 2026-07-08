import {
  Bot,
  ClipboardCheck,
  Mail,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { glassCard, glassIcon } from "@/components/marketing/glass-styles";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Mail,
    title: "Email & dashboard intake",
    description:
      "Tenants email COI PDFs to your AgentMail inbox or admins upload directly. Every submission is deduplicated, stored, and queued automatically.",
    accent: "text-sky-400",
  },
  {
    icon: Bot,
    title: "5-agent AI review",
    description:
      "LlamaParse OCR plus five specialized agents classify documents, extract fields, run checklist compliance, assess risk, and draft admin reports.",
    accent: "text-violet-400",
  },
  {
    icon: ClipboardCheck,
    title: "Editable compliance rules",
    description:
      "Configure checklist requirements in the admin UI — no code deploys. Agent 3 validates every COI against your landlord standards.",
    accent: "text-emerald-400",
  },
  {
    icon: ShieldCheck,
    title: "Guardrails on every step",
    description:
      "Input and output guardrails block prompt injection, invalid JSON, and unsafe outbound emails before tenants ever see a message.",
    accent: "text-amber-400",
  },
  {
    icon: Users,
    title: "Tenant activity timeline",
    description:
      "Full per-sender history: uploads, AI pipeline steps, outbound emails, and version lineage — one audit trail for every tenant.",
    accent: "text-rose-400",
  },
  {
    icon: Upload,
    title: "Version tracking",
    description:
      "Reject v1, tenant resubmits v2 — linked to the same sender with side-by-side compare. Never lose context on re-submissions.",
    accent: "text-primary",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Features</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to run COI compliance at scale
          </h2>
          <p className="mt-4 text-muted-foreground">
            From first PDF to approved certificate — intake, AI validation,
            admin review, and templated tenant communication in one workspace.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className={cn("border-0 bg-transparent shadow-none", glassCard)}>
                <CardHeader className="gap-3">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center",
                      glassIcon,
                      feature.accent
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

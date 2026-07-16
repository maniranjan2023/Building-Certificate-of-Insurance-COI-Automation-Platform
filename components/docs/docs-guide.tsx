"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  CloudUpload,
  Copy,
  ListTodo,
  Mail,
  Paperclip,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DocsSectionId =
  | "overview"
  | "email"
  | "upload"
  | "review"
  | "testing";

const SECTIONS: Array<{ id: DocsSectionId; label: string }> = [
  { id: "overview", label: "Start here" },
  { id: "email", label: "Send by email" },
  { id: "upload", label: "Upload in the app" },
  { id: "review", label: "Review & reply" },
  { id: "testing", label: "Quick checks" },
];

function StepList({
  steps,
}: {
  steps: Array<{ title: string; detail: string }>;
}) {
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="flex gap-3 rounded-xl border bg-muted/20 p-3 md:p-4"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold tabular-nums text-white">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="font-medium leading-tight">{step.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function CheckList({
  items,
}: {
  items: Array<{ label: string; hint?: string; href?: string }>;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-start gap-2.5 rounded-lg border bg-card/60 px-3 py-2.5"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{item.label}</p>
            {item.hint ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
            ) : null}
          </div>
          {item.href ? (
            <Button asChild size="sm" variant="outline" className="h-7 shrink-0 text-xs">
              <Link href={item.href}>Open</Link>
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be blocked; value stays visible to copy manually.
    }
  }

  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => void copy()}
        >
          <Copy className="size-3.5" />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="mt-1 break-all font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}

export function DocsGuide({ inboxEmail }: { inboxEmail: string }) {
  const [section, setSection] = useState<DocsSectionId>("overview");

  const emailExample = useMemo(
    () => ({
      to: inboxEmail,
      subject: "COI submission — [Tenant or property name]",
      body: `Hello,

Please find our Certificate of Insurance attached.

Tenant / company: [Name]
Property or unit: [Address or unit number]
Contact email: [Your reply email]

Thank you.`,
      attachment: "Your COI as a PDF file (preferred). JPEG or PNG photos also work.",
    }),
    [inboxEmail]
  );

  const content = useMemo(() => {
    switch (section) {
      case "overview":
        return (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              This app helps you collect Certificates of Insurance (COIs), check
              them against your rules, and reply to tenants. You can bring a COI
              in two ways — pick the one that fits.
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setSection("email")}
                className="rounded-2xl border bg-card p-4 text-left shadow-sm transition hover:border-blue-600/40 hover:bg-muted/30"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
                  <Mail className="size-4" />
                </div>
                <p className="mt-3 font-semibold">1. Send by email</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tenant emails the COI PDF to{" "}
                  <span className="font-medium text-foreground">{inboxEmail}</span>.
                  It shows up here automatically.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setSection("upload")}
                className="rounded-2xl border bg-card p-4 text-left shadow-sm transition hover:border-blue-600/40 hover:bg-muted/30"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
                  <CloudUpload className="size-4" />
                </div>
                <p className="mt-3 font-semibold">2. Upload in the app</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You (admin) upload the file from Portfolio and enter the
                  tenant&apos;s email. Same review steps after that.
                </p>
              </button>
            </div>

            <div className="rounded-2xl border border-blue-600/20 bg-blue-600/[0.06] p-4">
              <p className="text-sm font-medium">What happens next (both ways)</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                <li>The file is saved securely.</li>
                <li>The system reads the certificate and checks your checklist.</li>
                <li>You open the submission, review results, then accept or reject.</li>
                <li>The tenant can get an email with your decision.</li>
              </ol>
            </div>
          </div>
        );

      case "email":
        return (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Use this when a tenant (or you) sends the certificate by email.
              Fill in the fields below — then click Copy where helpful.
            </p>

            <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Mail className="size-4 text-blue-600" />
                Email recipe
              </div>
              <CopyField label="Send to (To)" value={emailExample.to} />
              <CopyField label="Subject" value={emailExample.subject} />
              <div className="rounded-xl border bg-background p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Body (message text)
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      void navigator.clipboard.writeText(emailExample.body);
                    }}
                  >
                    <Copy className="size-3.5" />
                    Copy
                  </Button>
                </div>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {emailExample.body}
                </pre>
              </div>
              <div className="rounded-xl border bg-background p-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Paperclip className="size-3.5" />
                  Attachment (required)
                </div>
                <p className="mt-2 text-sm text-foreground">
                  {emailExample.attachment}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>Attach the certificate file — do not only paste a link.</li>
                  <li>Preferred: one PDF named clearly (e.g. <code className="text-xs">COI-Acme.pdf</code>).</li>
                  <li>Also accepted: JPEG, PNG, or WebP images.</li>
                  <li>Without a valid attachment, the system cannot create a submission.</li>
                </ul>
              </div>
            </div>

            <StepList
              steps={[
                {
                  title: "Compose the email",
                  detail: `Send to ${inboxEmail}. Use a clear subject (tenant or property name helps). Put a short note in the body.`,
                },
                {
                  title: "Attach the COI file",
                  detail:
                    "Add the PDF (or image) before sending. This is the most important step.",
                },
                {
                  title: "Check Job Queue",
                  detail:
                    "In the left menu, open Job Queue. You should see a new job move from Queued → Processing → Ready for review.",
                },
                {
                  title: "Open the submission",
                  detail:
                    "Go to Portfolio, open the new row, and review the PDF, checklist, and draft notes.",
                },
                {
                  title: "Accept or reject",
                  detail:
                    "Use Review actions on the submission page. The tenant can receive an email with your decision.",
                },
              ]}
            />

            <CheckList
              items={[
                {
                  label: "Email was sent to the correct inbox address",
                  hint: inboxEmail,
                },
                {
                  label: "A PDF (or image) was attached",
                },
                {
                  label: "New row appears in Portfolio",
                  href: "/dashboard",
                },
                {
                  label: "Job reaches Ready for review",
                  href: "/dashboard/jobs",
                },
              ]}
            />

            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/jobs">
                <ListTodo className="size-3.5" />
                Open Job Queue
              </Link>
            </Button>
          </div>
        );

      case "upload":
        return (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Use this when you already have the COI file on your computer and
              want to add it yourself (no email needed).
            </p>
            <StepList
              steps={[
                {
                  title: "Open Portfolio",
                  detail:
                    "From the left menu, choose Portfolio. Use the upload card on that page.",
                },
                {
                  title: "Enter the tenant email",
                  detail:
                    "This links the file to the right person so versions and history stay together.",
                },
                {
                  title: "Choose the COI file",
                  detail:
                    "Pick a PDF (best), or a JPEG / PNG / WebP image of the certificate.",
                },
                {
                  title: "Wait for processing",
                  detail:
                    "Open the new submission or Job Queue. When status is Ready for review, results are ready.",
                },
                {
                  title: "Need a corrected file?",
                  detail:
                    "On the submission page, use Upload / resubmit to add the next version for the same tenant.",
                },
              ]}
            />
            <CheckList
              items={[
                {
                  label: "Upload finishes and a new Portfolio row appears",
                  href: "/dashboard",
                },
                {
                  label: "Document preview shows the PDF or image",
                },
                {
                  label: "Checklist and analysis appear after Ready for review",
                },
              ]}
            />
            <Button asChild size="sm">
              <Link href="/dashboard">
                <CloudUpload className="size-3.5" />
                Go to Portfolio
              </Link>
            </Button>
          </div>
        );

      case "review":
        return (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              After a COI is processed, you decide what happens next.
            </p>
            <StepList
              steps={[
                {
                  title: "Open a Ready for review submission",
                  detail:
                    "Portfolio → click the file. You will see the document, checklist results, and a draft summary.",
                },
                {
                  title: "Read the checklist",
                  detail:
                    "Green/pass means the rule looks good. Fail means something is missing or unclear — read the evidence text.",
                },
                {
                  title: "Accept or reject",
                  detail:
                    "Accept confirms coverage looks fine. Reject needs a short reason so the tenant knows what to fix.",
                },
                {
                  title: "Optional setup",
                  detail:
                    "Checklist page = your rules. Email Templates = the wording tenants receive for accept, reject, and reminders.",
                },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/checklist">
                  <ClipboardCheck className="size-3.5" />
                  Checklist rules
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/templates">
                  <Mail className="size-3.5" />
                  Email templates
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/tenants">
                  <ShieldCheck className="size-3.5" />
                  Tenant history
                </Link>
              </Button>
            </div>
          </div>
        );

      case "testing":
        return (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              After a change or a fresh login, walk through these quick checks.
              You do not need technical tools — just the screens in this app.
            </p>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">A. Getting a COI in</h3>
              <CheckList
                items={[
                  {
                    label: "Upload from Portfolio creates a new row",
                    href: "/dashboard",
                  },
                  {
                    label: "Email with a PDF attachment also creates a new row",
                    hint: `Send to ${inboxEmail} with a COI attached`,
                  },
                ]}
              />
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">B. Processing</h3>
              <CheckList
                items={[
                  {
                    label: "Job Queue reaches Ready for review",
                    href: "/dashboard/jobs",
                  },
                  {
                    label: "Preview opens and checklist shows Pass / Fail rows",
                  },
                ]}
              />
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">C. Reply to tenant</h3>
              <CheckList
                items={[
                  {
                    label: "Accept or Reject sends an email (check Templates first)",
                    href: "/templates",
                  },
                  {
                    label: "Tenant history shows the email was sent",
                    href: "/tenants",
                  },
                ]}
              />
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">D. Expiry reminders</h3>
              <CheckList
                items={[
                  {
                    label: "Job Queue → Cron scan history shows daily reminder runs",
                    href: "/dashboard/jobs",
                    hint: "Reminders go out when a COI expires in about 30, 14, 7, or 3 days",
                  },
                ]}
              />
            </section>
          </div>
        );

      default:
        return null;
    }
  }, [section, inboxEmail, emailExample]);

  const title =
    SECTIONS.find((entry) => entry.id === section)?.label ??
    "How to use this platform";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div className="rounded-xl border bg-card p-5 shadow-sm md:p-6">
        <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-blue-600">
          <BookOpen className="size-3.5" />
          Help
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          How to use this platform
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Plain steps for admins — send a COI by email, upload one yourself, then
          review and reply. No technical background needed.
        </p>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[200px_1fr]">
        <nav
          aria-label="How to use this platform"
          className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-2 lg:flex-col lg:overflow-visible"
        >
          {SECTIONS.map((entry) => {
            const active = section === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSection(entry.id)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-600/10 text-blue-700 dark:text-blue-300"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {entry.label}
              </button>
            );
          })}
        </nav>

        <section className="min-w-0 rounded-xl border bg-card p-4 shadow-sm md:p-6">
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          </div>
          {content}
        </section>
      </div>
    </div>
  );
}

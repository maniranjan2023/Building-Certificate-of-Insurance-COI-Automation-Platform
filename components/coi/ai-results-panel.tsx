import type {
  ChecklistAgentOutput,
  ExtractionAgentOutput,
  ReportAgentOutput,
  RiskAgentOutput,
} from "@/lib/ai/schemas";
import type { AiRunWithSteps } from "@/lib/services/ai-run";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AiResultsPanelProps {
  version: {
    rawOcrText?: string | null;
    extractedFields?: unknown;
    checklistResults?: unknown;
    riskAnalysis?: unknown;
    draftReport?: unknown;
    aiSuggestedTemplate?: string | null;
  };
  aiRun: AiRunWithSteps | null;
  hideTimeline?: boolean;
}

function asExtraction(value: unknown): ExtractionAgentOutput | null {
  return value && typeof value === "object" ? (value as ExtractionAgentOutput) : null;
}

function asChecklist(value: unknown): ChecklistAgentOutput | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<ChecklistAgentOutput>;
  if (!Array.isArray(raw.items)) return null;
  return {
    items: raw.items,
    mandatoryFailures: Array.isArray(raw.mandatoryFailures)
      ? raw.mandatoryFailures
      : [],
    allPassed: raw.allPassed ?? false,
  };
}

function asRisk(value: unknown): RiskAgentOutput | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<RiskAgentOutput>;
  if (!raw.overallRisk) return null;
  return {
    overallRisk: raw.overallRisk,
    mandatoryFailures: Array.isArray(raw.mandatoryFailures)
      ? raw.mandatoryFailures
      : [],
    optionalIssues: Array.isArray(raw.optionalIssues) ? raw.optionalIssues : [],
    lowConfidenceFields: Array.isArray(raw.lowConfidenceFields)
      ? raw.lowConfidenceFields
      : [],
    recommendationHint: raw.recommendationHint ?? "manual_review",
    confidenceScore:
      typeof raw.confidenceScore === "number" ? raw.confidenceScore : 0,
  };
}

function asReport(value: unknown): ReportAgentOutput | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<ReportAgentOutput>;
  if (!raw.summary && !raw.recommendationReason) return null;
  return {
    summary: raw.summary ?? "No summary available.",
    recommendation: raw.recommendation ?? "manual_review",
    recommendationReason: raw.recommendationReason ?? "",
    missingItems: Array.isArray(raw.missingItems) ? raw.missingItems : [],
    matchedItems: Array.isArray(raw.matchedItems) ? raw.matchedItems : [],
    citations: Array.isArray(raw.citations) ? raw.citations : [],
    suggestedEmailBody: raw.suggestedEmailBody ?? "",
    confidenceScore:
      typeof raw.confidenceScore === "number" ? raw.confidenceScore : 0,
  };
}

function statusColor(status: string): string {
  if (status === "PASS") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (status === "FAIL") return "bg-red-500/15 text-red-400 border-red-500/30";
  return "bg-amber-500/15 text-amber-400 border-amber-500/30";
}

export function AiResultsPanel({ version, aiRun, hideTimeline }: AiResultsPanelProps) {
  const extraction = asExtraction(version.extractedFields);
  const checklist = asChecklist(version.checklistResults);
  const risk = asRisk(version.riskAnalysis);
  const report = asReport(version.draftReport);

  const hasResults =
    extraction || checklist || risk || report || version.rawOcrText || aiRun;

  if (!hasResults) {
    return (
      <Card className="gap-3 py-4">
        <CardHeader className="gap-1 px-4 pb-0">
          <CardTitle className="text-lg">AI analysis</CardTitle>
          <CardDescription className="text-sm">
            Results appear here after the worker completes the Phase 4 pipeline.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <section className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight">AI analysis</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {version.aiSuggestedTemplate
              ? `Suggested template: ${version.aiSuggestedTemplate.replace(/_/g, " ")}`
              : "Pipeline output from document → extraction → checklist → risk → report"}
          </p>
        </div>
        {aiRun ? (
          <div className="px-5 py-4 text-sm">
            <p className="text-muted-foreground">
              Run status:{" "}
              <span className="font-medium text-foreground">{aiRun.status}</span>
              {aiRun.exitReason ? ` · ${aiRun.exitReason}` : ""}
            </p>
          </div>
        ) : null}
      </section>

      {extraction ? (
        <Card className="gap-3 py-4">
          <CardHeader className="gap-1 px-4 pb-0">
            <CardTitle className="text-lg">Important details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 px-4 pb-4 text-sm sm:grid-cols-2">
            {(
              [
                ["Carrier", extraction.carrierName],
                ["Policy #", extraction.policyNumber],
                ["Named insured", extraction.namedInsured],
                ["Additional insured", extraction.additionalInsured],
                ["Certificate holder", extraction.certificateHolder],
                ["Effective", extraction.effectiveDate],
                ["Expiration", extraction.expirationDate],
                ["GL limit", extraction.generalLiabilityLimit],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <p className="text-muted-foreground">{label}</p>
                <p className="font-medium">{value ?? "—"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {checklist?.items?.length ? (
        <Card className="gap-3 py-4">
          <CardHeader className="gap-1 px-4 pb-0">
            <CardTitle className="text-lg">Checklist results</CardTitle>
            <CardDescription className="text-sm">
              {checklist.allPassed
                ? "All checklist items passed"
                : `${checklist.mandatoryFailures.length} mandatory issue(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4">
            {checklist.items.map((item) => (
              <div
                key={item.checklistItemId}
                className="flex flex-wrap items-start justify-between gap-2 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{item.label}</p>
                  {item.evidence ? (
                    <p className="mt-1 text-muted-foreground">{item.evidence}</p>
                  ) : null}
                </div>
                <Badge variant="outline" className={statusColor(item.status)}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {risk ? (
        <Card className="gap-3 py-4">
          <CardHeader className="gap-1 px-4 pb-0">
            <CardTitle className="text-lg">Risk analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4 text-sm">
            <p>
              Overall risk:{" "}
              <span className="font-medium capitalize">{risk.overallRisk}</span>
            </p>
            <p>
              Recommendation hint:{" "}
              <span className="font-medium">{risk.recommendationHint.replace(/_/g, " ")}</span>
            </p>
            <p className="text-muted-foreground">
              Confidence: {Math.round(risk.confidenceScore * 100)}%
            </p>
          </CardContent>
        </Card>
      ) : null}

      {report ? (
        <Card className="gap-3 py-4">
          <CardHeader className="gap-1 px-4 pb-0">
            <CardTitle className="text-lg">Draft report</CardTitle>
            <CardDescription className="text-sm">
              Edit before sending tenant notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4 text-sm">
            <p>{report.summary}</p>
            <p className="text-muted-foreground">{report.recommendationReason}</p>
            {report.missingItems.length > 0 ? (
              <div>
                <p className="font-medium">Missing / failed items</p>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">
                  {report.missingItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {aiRun?.steps?.length && !hideTimeline ? (
        <Card className="gap-3 py-4">
          <CardHeader className="gap-1 px-4 pb-0">
            <CardTitle className="text-lg">Agent timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4">
            {aiRun.steps.map((step) => (
              <div
                key={step.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {step.agentName ?? step.kind}
                    {step.modelUsed ? ` · ${step.modelUsed}` : ""}
                  </p>
                  {step.tripwireReason ? (
                    <p className="text-red-400">{step.tripwireReason}</p>
                  ) : null}
                </div>
                {step.durationMs != null ? (
                  <span className="text-muted-foreground">{step.durationMs}ms</span>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

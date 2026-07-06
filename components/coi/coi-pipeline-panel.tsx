"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AiResultsPanel } from "@/components/coi/ai-results-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatStepLabel } from "@/lib/constants/pipeline-stages";
import { JOB_STATUS_LABELS } from "@/lib/constants/job-status";
import type { AiRunWithSteps } from "@/lib/services/ai-run";
import type {
  AgentStepView,
  PipelineStageView,
  PipelineStatusResponse,
} from "@/lib/services/pipeline-status";
import { cn } from "@/lib/utils";

interface CoiPipelinePanelProps {
  documentId: string;
  initialStatus: PipelineStatusResponse;
}

function stageBadgeClass(status: PipelineStageView["status"]): string {
  switch (status) {
    case "running":
      return "border-sky-500/40 bg-sky-500/10 text-sky-400";
    case "completed":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
    case "failed":
      return "border-red-500/40 bg-red-500/10 text-red-400";
    case "skipped":
      return "border-amber-500/40 bg-amber-500/10 text-amber-400";
    default:
      return "border-muted bg-muted/30 text-muted-foreground";
  }
}

function formatJson(value: unknown): string {
  if (value == null) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function AgentStepCard({ step }: { step: AgentStepView }) {
  const title = step.agentName ?? step.kind;
  const failed = step.guardrailPassed === false || Boolean(step.tripwireReason);

  return (
    <details className="rounded-lg border bg-card">
      <summary className="cursor-pointer list-none px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{title}</span>
            {step.modelUsed ? (
              <span className="text-xs text-muted-foreground">{step.modelUsed}</span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-xs">
            {failed ? (
              <Badge variant="outline" className="border-red-500/40 text-red-400">
                Failed
              </Badge>
            ) : step.output != null ? (
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
                Completed
              </Badge>
            ) : (
              <Badge variant="outline">Logged</Badge>
            )}
            {step.durationMs != null ? (
              <span className="text-muted-foreground">{step.durationMs}ms</span>
            ) : null}
          </div>
        </div>
        {step.tripwireReason ? (
          <p className="mt-1 text-sm text-red-400">{step.tripwireReason}</p>
        ) : null}
      </summary>
      <div className="space-y-3 border-t px-4 py-3 text-sm">
        {step.input != null ? (
          <div>
            <p className="mb-1 font-medium text-muted-foreground">Input</p>
            <pre className="max-h-48 overflow-auto rounded-md bg-muted/50 p-3 text-xs">
              {formatJson(step.input)}
            </pre>
          </div>
        ) : null}
        {step.output != null ? (
          <div>
            <p className="mb-1 font-medium text-muted-foreground">Output</p>
            <pre className="max-h-80 overflow-auto rounded-md bg-muted/50 p-3 text-xs">
              {formatJson(step.output)}
            </pre>
          </div>
        ) : null}
      </div>
    </details>
  );
}

export function CoiPipelinePanel({
  documentId,
  initialStatus,
}: CoiPipelinePanelProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/coi/${documentId}/pipeline-status`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        success: boolean;
        data?: PipelineStatusResponse;
      };
      if (payload.success && payload.data) {
        setStatus(payload.data);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (!status.isActive) return;
    const interval = setInterval(() => {
      void fetchStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, [status.isActive, fetchStatus]);

  const syntheticAiRun: AiRunWithSteps | null =
    status.steps.length > 0 || status.aiRunStatus
      ? ({
          id: status.jobId ?? "unknown",
          status: status.aiRunStatus ?? "RUNNING",
          exitReason: status.exitReason,
          suggestedTemplate: status.suggestedTemplate,
          currentStepLabel: status.currentStepLabel,
          startedAt: new Date(),
          completedAt: null,
          coiJobId: status.jobId ?? "",
          coiVersionId: "",
          steps: status.steps.map((step) => ({
            id: step.id,
            aiRunId: status.jobId ?? "",
            stepOrder: step.stepOrder,
            kind: step.kind,
            agentName: step.agentName,
            modelUsed: step.modelUsed,
            input: step.input,
            output: step.output,
            guardrailPassed: step.guardrailPassed,
            tripwireReason: step.tripwireReason,
            durationMs: step.durationMs,
            createdAt: new Date(step.createdAt),
          })),
        } as AiRunWithSteps)
      : null;

  return (
    <div className="space-y-4">
      <Card className="gap-3 py-4">
        <CardHeader className="gap-1 px-4 pb-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Processing pipeline</CardTitle>
              <CardDescription className="text-sm">
                Live status of your PDF through the worker and AI agents
              </CardDescription>
            </div>
            {status.isActive ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isRefreshing ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Live · updates every 2s
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          <div className="flex flex-wrap gap-2 text-sm">
            {status.jobStatus ? (
              <Badge variant="outline">
                Job: {JOB_STATUS_LABELS[status.jobStatus]}
              </Badge>
            ) : null}
            {status.aiRunStatus ? (
              <Badge variant="outline">AI run: {status.aiRunStatus}</Badge>
            ) : null}
            {status.isActive && status.currentStepLabel ? (
              <Badge variant="outline" className="border-sky-500/40 text-sky-400">
                Now: {formatStepLabel(status.currentStepLabel)}
              </Badge>
            ) : null}
          </div>

          {status.failureReason ? (
            <p className="text-sm text-red-400">{status.failureReason}</p>
          ) : null}

          <ol className="space-y-2">
            {status.stages.map((stage) => (
              <li
                key={stage.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm",
                  stageBadgeClass(stage.status)
                )}
              >
                <span>{stage.label}</span>
                <span className="text-xs uppercase tracking-wide">{stage.status}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="gap-3 py-4">
        <CardHeader className="gap-1 px-4 pb-0">
          <CardTitle className="text-lg">Agent outputs</CardTitle>
          <CardDescription className="text-sm">
            Expand each step to see the raw input and JSON output from that agent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4">
          {status.isActive && status.steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Waiting for worker to start… current stage:{" "}
              {formatStepLabel(status.currentStepLabel ?? "worker")}
            </p>
          ) : null}
          {status.steps.length === 0 && !status.isActive ? (
            <p className="text-sm text-muted-foreground">
              No agent steps recorded yet. Upload a COI and ensure the worker is running.
            </p>
          ) : null}
          {status.steps.map((step) => (
            <AgentStepCard key={step.id} step={step} />
          ))}
          {status.isActive ? (
            <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-sky-400" />
              {formatStepLabel(status.currentStepLabel ?? "processing")}…
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AiResultsPanel
        version={status.version ?? {}}
        aiRun={syntheticAiRun}
        hideTimeline
      />
    </div>
  );
}

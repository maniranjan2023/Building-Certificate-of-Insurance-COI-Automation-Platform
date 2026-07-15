"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { AgentOutputDialog } from "@/components/coi/agent-output-dialog";
import { buildPipelineTimelineItems } from "@/components/coi/pipeline-timeline-utils";
import { AiResultsPanel } from "@/components/coi/ai-results-panel";
import { Badge } from "@/components/ui/badge";
import { Timeline } from "@/components/ui/timeline";
import { formatStepLabel } from "@/lib/constants/pipeline-stages";
import { JOB_STATUS_LABELS } from "@/lib/constants/job-status";
import type { AiRunWithSteps } from "@/lib/services/ai-run";
import type {
  AgentStepView,
  PipelineStatusResponse,
} from "@/lib/services/pipeline-status";

interface CoiPipelinePanelProps {
  documentId: string;
  initialStatus: PipelineStatusResponse;
}

export function CoiPipelinePanel({
  documentId,
  initialStatus,
}: CoiPipelinePanelProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStep, setSelectedStep] = useState<AgentStepView | null>(null);
  const [selectedStageLabel, setSelectedStageLabel] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

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
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (!status.isActive) return;
    const interval = setInterval(() => {
      void fetchStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, [status.isActive, fetchStatus]);

  const handleSelectStep = useCallback(
    (step: AgentStepView | null, stageLabel: string) => {
      setSelectedStep(step);
      setSelectedStageLabel(stageLabel);
      setDialogOpen(true);
    },
    []
  );

  const timelineItems = useMemo(
    () =>
      buildPipelineTimelineItems({
        stages: status.stages,
        steps: status.steps,
        onSelectStep: handleSelectStep,
      }),
    [status.stages, status.steps, handleSelectStep]
  );

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
    <div className="min-w-0 space-y-4">
      <section className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_0%,oklch(0.62_0.19_255/0.08),transparent_60%)]"
        />
        <div className="relative space-y-4 p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight">AI processing pipeline</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Live worker and agent steps. Click a completed step to inspect input and JSON output.
              </p>
            </div>
            {status.isActive ? (
              <div className="flex shrink-0 items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground">
                {isRefreshing ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Live · updates every 2s
              </div>
            ) : null}
          </div>

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
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {status.failureReason}
            </p>
          ) : null}

          <div className="min-w-0 rounded-xl border bg-muted/20 p-4">
            {status.isActive && status.steps.length === 0 ? (
              <p className="mb-3 text-sm text-muted-foreground">
                Waiting for worker to start… current stage:{" "}
                {formatStepLabel(status.currentStepLabel ?? "worker")}
              </p>
            ) : null}
            {status.steps.length === 0 && !status.isActive ? (
              <p className="mb-3 text-sm text-muted-foreground">
                No pipeline activity yet. Upload a COI and ensure the worker is running.
              </p>
            ) : null}

            <Timeline
              items={timelineItems}
              orientation="horizontal"
              variant="compact"
            />

            {status.isActive ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-sky-400" />
                {formatStepLabel(status.currentStepLabel ?? "processing")}…
              </div>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            Completed steps with agent data open a detail dialog. Scroll the timeline horizontally if needed.
          </p>
        </div>
      </section>

      <AgentOutputDialog
        step={selectedStep}
        stageLabel={selectedStageLabel}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <AiResultsPanel
        version={status.version ?? {}}
        aiRun={syntheticAiRun}
        hideTimeline
        hideChecklist
      />
    </div>
  );
}

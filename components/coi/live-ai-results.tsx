"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AiResultsPanel } from "@/components/coi/ai-results-panel";
import type { AiRunWithSteps } from "@/lib/services/ai-run";
import type { PipelineStatusResponse } from "@/lib/services/pipeline-status";

interface LiveAiResultsProps {
  documentId: string;
  initialStatus: PipelineStatusResponse | null;
  isPipelineActive: boolean;
}

/** Live-updating AI analysis / details / risk / draft stacked under the pipeline. */
export function LiveAiResults({
  documentId,
  initialStatus,
  isPipelineActive,
}: LiveAiResultsProps) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/coi/${documentId}/pipeline-status`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        success?: boolean;
        data?: PipelineStatusResponse;
      };
      if (payload.success && payload.data) {
        setStatus(payload.data);
      }
    } catch {
      // Keep last known results on transient failures.
    }
  }, [documentId]);

  useEffect(() => {
    if (!isPipelineActive) return;
    const interval = setInterval(() => {
      void refresh();
    }, 2500);
    return () => clearInterval(interval);
  }, [isPipelineActive, refresh]);

  const syntheticAiRun: AiRunWithSteps | null = useMemo(() => {
    if (!status) return null;
    if (status.steps.length === 0 && !status.aiRunStatus) return null;

    return {
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
    } as AiRunWithSteps;
  }, [status]);

  return (
    <AiResultsPanel
      version={status?.version ?? {}}
      aiRun={syntheticAiRun}
      hideTimeline
      hideChecklist
    />
  );
}

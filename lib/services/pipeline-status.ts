import {
  AiRunStatus,
  JobStatus,
  type AgentStep,
  type CoiJob,
} from "@prisma/client";
import {
  PIPELINE_STAGES,
  type PipelineStageStatus,
} from "@/lib/constants/pipeline-stages";
import { getLatestAiRunForVersion } from "@/lib/services/ai-run";
import { getCoiDocumentByIdWithLatestJob } from "@/lib/services/coi";
import { prisma } from "@/lib/prisma";

export interface PipelineStageView {
  id: string;
  label: string;
  status: PipelineStageStatus;
}

export interface AgentStepView {
  id: string;
  stepOrder: number;
  kind: string;
  agentName: string | null;
  modelUsed: string | null;
  durationMs: number | null;
  guardrailPassed: boolean | null;
  tripwireReason: string | null;
  input: unknown;
  output: unknown;
  createdAt: string;
}

export interface PipelineStatusResponse {
  jobStatus: JobStatus | null;
  jobId: string | null;
  failureReason: string | null;
  isActive: boolean;
  aiRunStatus: AiRunStatus | null;
  currentStepLabel: string | null;
  exitReason: string | null;
  suggestedTemplate: string | null;
  stages: PipelineStageView[];
  steps: AgentStepView[];
  version: {
    rawOcrText?: string | null;
    extractedFields?: unknown;
    checklistResults?: unknown;
    riskAnalysis?: unknown;
    draftReport?: unknown;
    aiSuggestedTemplate?: string | null;
    fieldBoundingBoxes?: unknown;
  } | null;
}

function toStepView(step: AgentStep): AgentStepView {
  return {
    id: step.id,
    stepOrder: step.stepOrder,
    kind: step.kind,
    agentName: step.agentName,
    modelUsed: step.modelUsed,
    durationMs: step.durationMs,
    guardrailPassed: step.guardrailPassed,
    tripwireReason: step.tripwireReason,
    input: step.input,
    output: step.output,
    createdAt: step.createdAt.toISOString(),
  };
}

function stepKeyForAgentStep(step: AgentStep): string {
  return step.agentName ?? step.kind.toLowerCase();
}

function buildStages(options: {
  job: CoiJob | null;
  aiRunStatus: AiRunStatus | null;
  currentStepLabel: string | null;
  steps: AgentStep[];
  jobFailed: boolean;
}): PipelineStageView[] {
  const completedKeys = new Set(options.steps.map(stepKeyForAgentStep));
  const failedStep = options.steps.find((s) => s.tripwireReason);
  const failedKey = failedStep ? stepKeyForAgentStep(failedStep) : null;

  let activeIndex = -1;

  if (options.job?.status === JobStatus.QUEUED) {
    activeIndex = 0;
  } else if (
    options.job?.status === JobStatus.PROCESSING &&
    !options.aiRunStatus
  ) {
    activeIndex = 1;
  } else if (options.aiRunStatus === AiRunStatus.RUNNING) {
    if (options.currentStepLabel) {
      activeIndex = PIPELINE_STAGES.findIndex(
        (s) => s.stepKey === options.currentStepLabel || s.id === options.currentStepLabel
      );
    }
    if (activeIndex < 0) {
      activeIndex = Math.min(
        2 + options.steps.length,
        PIPELINE_STAGES.length - 2
      );
    }
  } else if (
    options.aiRunStatus === AiRunStatus.COMPLETED ||
    options.job?.status === JobStatus.READY_FOR_REVIEW
  ) {
    activeIndex = PIPELINE_STAGES.length - 1;
  } else if (options.jobFailed || options.aiRunStatus === AiRunStatus.FAILED) {
    activeIndex = failedKey
      ? PIPELINE_STAGES.findIndex(
          (s) => s.stepKey === failedKey || s.id === failedKey
        )
      : 1;
  }

  return PIPELINE_STAGES.map((stage, index) => {
    let status: PipelineStageStatus = "pending";

    const stageKey = stage.stepKey ?? stage.id;
    const isCompleted =
      stage.id === "queued"
        ? options.job != null && options.job.status !== JobStatus.QUEUED
        : stage.id === "worker"
          ? Boolean(options.aiRunStatus) || completedKeys.size > 0
          : stage.id === "ready"
            ? options.job?.status === JobStatus.READY_FOR_REVIEW ||
              options.aiRunStatus === AiRunStatus.COMPLETED
            : completedKeys.has(stageKey);

    if (failedKey && (stage.stepKey === failedKey || stage.id === failedKey)) {
      status = "failed";
    } else if (isCompleted) {
      status = "completed";
    } else if (index === activeIndex) {
      status = "running";
    } else if (index < activeIndex) {
      status = "completed";
    }

    if (
      options.aiRunStatus === AiRunStatus.STOPPED_EARLY &&
      stage.id === "ready" &&
      status === "pending"
    ) {
      status = "skipped";
    }

    return { id: stage.id, label: stage.label, status };
  });
}

export async function getPipelineStatusForDocument(
  documentId: string
): Promise<PipelineStatusResponse | null> {
  const document = await getCoiDocumentByIdWithLatestJob(documentId);
  if (!document?.version) {
    return null;
  }

  const job = document.latestJob;
  const aiRun = await getLatestAiRunForVersion(document.version.id);
  const version = await prisma.coiVersion.findUnique({
    where: { id: document.version.id },
    select: {
      rawOcrText: true,
      extractedFields: true,
      checklistResults: true,
      riskAnalysis: true,
      draftReport: true,
      aiSuggestedTemplate: true,
      fieldBoundingBoxes: true,
    },
  });

  const jobFailed =
    job?.status === JobStatus.FAILED || job?.status === JobStatus.DLQ;

  const isActive =
    job?.status === JobStatus.QUEUED ||
    job?.status === JobStatus.PROCESSING ||
    aiRun?.status === AiRunStatus.RUNNING;

  return {
    jobStatus: job?.status ?? null,
    jobId: job?.id ?? null,
    failureReason: job?.failureReason ?? aiRun?.exitReason ?? null,
    isActive,
    aiRunStatus: aiRun?.status ?? null,
    currentStepLabel: aiRun?.currentStepLabel ?? null,
    exitReason: aiRun?.exitReason ?? null,
    suggestedTemplate: aiRun?.suggestedTemplate ?? version?.aiSuggestedTemplate ?? null,
    stages: buildStages({
      job,
      aiRunStatus: aiRun?.status ?? null,
      currentStepLabel: aiRun?.currentStepLabel ?? null,
      steps: aiRun?.steps ?? [],
      jobFailed,
    }),
    steps: (aiRun?.steps ?? []).map(toStepView),
    version,
  };
}

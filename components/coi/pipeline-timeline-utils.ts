import {
  PIPELINE_STAGES,
  type PipelineStageStatus,
} from "@/lib/constants/pipeline-stages";
import type { AgentStepView, PipelineStageView } from "@/lib/services/pipeline-status";
import type { TimelineItem, TimelineStepStatus } from "@/components/ui/timeline";

function mapStageStatus(status: PipelineStageStatus): TimelineStepStatus {
  switch (status) {
    case "running":
      return "active";
    case "completed":
      return "completed";
    case "failed":
      return "error";
    case "skipped":
      return "skipped";
    default:
      return "pending";
  }
}

function stepLookupKey(step: AgentStepView): string {
  return (step.agentName ?? step.kind.toLowerCase()).toLowerCase();
}

function stageLookupKeys(stageId: string): string[] {
  const def = PIPELINE_STAGES.find((stage) => stage.id === stageId);
  const keys = [stageId];
  if (def?.stepKey) keys.push(def.stepKey);
  return keys;
}

export function findAgentStepForStage(
  stageId: string,
  steps: AgentStepView[]
): AgentStepView | null {
  const keys = stageLookupKeys(stageId).map((key) => key.toLowerCase());

  if (stageId === "downloading") {
    return (
      steps.find((step) => stepLookupKey(step) === "llamaparse") ??
      steps.find((step) => step.kind.toLowerCase() === "llamaparse") ??
      null
    );
  }

  return (
    steps.find((step) => keys.includes(stepLookupKey(step))) ??
    steps.find((step) => keys.includes(step.kind.toLowerCase())) ??
    null
  );
}

function shortStageTitle(label: string): string {
  return label
    .replace(/^Agent \d+ — /, "")
    .replace(/^OCR — /, "OCR · ")
    .replace("Queued in BullMQ", "Queued")
    .replace("Worker picked up job", "Worker")
    .replace("Ready for admin review", "Ready");
}

export function buildPipelineTimelineItems(options: {
  stages: PipelineStageView[];
  steps: AgentStepView[];
  onSelectStep: (step: AgentStepView | null, stageLabel: string) => void;
}): TimelineItem[] {
  return options.stages.map((stage) => {
    const agentStep = findAgentStepForStage(stage.id, options.steps);
    const timelineStatus = mapStageStatus(stage.status);
    const hasOutput = Boolean(
      agentStep &&
        (agentStep.input != null ||
          agentStep.output != null ||
          agentStep.tripwireReason)
    );
    const clickable =
      (timelineStatus === "completed" ||
        timelineStatus === "error" ||
        timelineStatus === "skipped") &&
      hasOutput;

    return {
      id: stage.id,
      title: shortStageTitle(stage.label),
      description: stage.label,
      status: timelineStatus,
      clickable,
      onClick: clickable
        ? () => options.onSelectStep(agentStep, stage.label)
        : undefined,
    };
  });
}

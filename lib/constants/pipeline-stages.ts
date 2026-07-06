export type PipelineStageStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export interface PipelineStageDefinition {
  id: string;
  label: string;
  /** Matches AiRun.currentStepLabel or AgentStep.agentName */
  stepKey?: string;
}

export const PIPELINE_STAGES: PipelineStageDefinition[] = [
  { id: "queued", label: "Queued in BullMQ" },
  { id: "worker", label: "Worker picked up job" },
  { id: "downloading", label: "Downloading PDF from Cloudinary", stepKey: "downloading" },
  { id: "llamaparse", label: "OCR — LlamaParse", stepKey: "llamaparse" },
  { id: "document-agent", label: "Agent 1 — Document classification", stepKey: "document-agent" },
  { id: "extraction-agent", label: "Agent 2 — Field extraction", stepKey: "extraction-agent" },
  { id: "checklist-agent", label: "Agent 3 — Checklist comparison", stepKey: "checklist-agent" },
  { id: "risk-agent", label: "Agent 4 — Risk analysis", stepKey: "risk-agent" },
  { id: "report-agent", label: "Agent 5 — Draft report", stepKey: "report-agent" },
  { id: "ready", label: "Ready for admin review" },
];

export function formatStepLabel(stepKey: string | null | undefined): string {
  if (!stepKey) return "Processing";
  const stage = PIPELINE_STAGES.find((s) => s.stepKey === stepKey || s.id === stepKey);
  return stage?.label ?? stepKey.replace(/-/g, " ");
}

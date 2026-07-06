export type TenantActivityEventKind =
  | "coi_uploaded"
  | "job_update"
  | "ai_run"
  | "agent_step"
  | "email_sent"
  | "email_failed"
  | "version_accepted"
  | "version_rejected";

export const TENANT_ACTIVITY_KIND_LABELS: Record<TenantActivityEventKind, string> = {
  coi_uploaded: "COI uploaded",
  job_update: "Processing job",
  ai_run: "AI pipeline",
  agent_step: "AI agent step",
  email_sent: "Email sent",
  email_failed: "Email failed",
  version_accepted: "COI accepted",
  version_rejected: "COI rejected",
};

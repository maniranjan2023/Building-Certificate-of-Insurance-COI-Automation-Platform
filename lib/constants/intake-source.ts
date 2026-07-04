import type { IntakeSource } from "@prisma/client";

export const INTAKE_SOURCE_LABELS: Record<IntakeSource, string> = {
  DASHBOARD: "Dashboard Upload",
  EMAIL: "Email (AgentMail)",
};

export const INTAKE_SOURCE_DESCRIPTIONS: Record<IntakeSource, string> = {
  DASHBOARD: "Uploaded manually from the admin dashboard",
  EMAIL: "Received via AgentMail webhook",
};

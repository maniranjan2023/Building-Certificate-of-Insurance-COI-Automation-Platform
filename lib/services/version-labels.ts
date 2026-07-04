import type { CoiStatus } from "@prisma/client";

export const COI_STATUS_LABELS: Record<CoiStatus, string> = {
  PENDING_REVIEW: "Pending Review",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRING_SOON: "Expiring Soon",
  EXPIRED: "Expired",
};

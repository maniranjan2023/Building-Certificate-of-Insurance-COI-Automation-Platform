import { jsonError } from "@/lib/api-response";

const GENERIC_SERVER_ERROR = "An unexpected error occurred.";

export function jsonInternalError(
  error: unknown,
  context: string,
  status = 500
): Response {
  console.error(`[${context}]`, error);
  return jsonError(GENERIC_SERVER_ERROR, status);
}

import { buildCoiAuditExport } from "@/lib/services/audit-export";
import { jsonError } from "@/lib/api-response";
import { jsonInternalError } from "@/lib/api/handle-route-error";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  try {
    const { id } = await context.params;
    const audit = await buildCoiAuditExport(id);

    if (!audit) {
      return jsonError("COI document not found.", 404);
    }

    const fileName = `coi-audit-${id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;

    return new Response(JSON.stringify(audit, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return jsonInternalError(error, "coi.[id].audit-export");
  }
}

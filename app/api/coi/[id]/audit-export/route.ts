import { buildCoiAuditExport } from "@/lib/services/audit-export";
import { jsonError } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
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
    const message =
      error instanceof Error ? error.message : "Failed to export audit log.";
    return jsonError(message, 500);
  }
}

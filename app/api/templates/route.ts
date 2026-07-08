import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-response";
import {
  listEmailTemplates,
} from "@/lib/services/email-templates";
import { EMAIL_TEMPLATE_KEYS } from "@/lib/constants/email-templates";
import { renderEmailContent } from "@/lib/services/template-render";

export async function GET() {
  try {
    const templates = await listEmailTemplates();
    return jsonOk(templates);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load templates.";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = z
      .object({
        key: z.enum(EMAIL_TEMPLATE_KEYS as unknown as [string, ...string[]]),
        previewVariables: z.record(z.string(), z.string()).optional(),
      })
      .parse(await request.json());

    const templates = await listEmailTemplates();
    const template = templates.find((t) => t.key === body.key);
    if (!template) {
      return jsonError("Template not found.", 404);
    }

    const rendered = renderEmailContent({
      subject: template.subject,
      body: template.body,
      variables: body.previewVariables ?? {
        sender_name: "Jane Tenant",
        sender_email: "tenant@example.com",
        property_name: "450 Market Plaza",
        expiry_date: "01/01/2027",
        policy_number: "CGL-123456",
        carrier_name: "Sample Insurance Co.",
        missing_items: "• Additional insured endorsement",
        rejection_reason: "Missing waiver of subrogation",
        version_number: "v2",
        submission_date: new Date().toISOString().slice(0, 10),
        matched_items: "• General liability limits",
        ai_summary: "COI reviewed; additional insured missing.",
        guardrail_citations:
          '• [Input screening (document-agent)] Prohibited instructional language detected: "ignore previous instructions"',
        guardrail_summary:
          "Prohibited instructional language detected in the submitted document.",
        agent_step: "document-agent",
        signatory_name: "Jane Smith",
        signatory_title: "Compliance Coordinator",
        company_name: "Oakwood Property Management LLC",
      },
    });

    return jsonOk({ subject: rendered.subject, body: rendered.text });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid request.", 400);
    }
    const message =
      error instanceof Error ? error.message : "Preview failed.";
    return jsonError(message, 500);
  }
}

export async function PATCH(request: Request) {
  return jsonError("Use PATCH /api/templates/[key] instead.", 405);
}

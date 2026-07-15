import { listEmailTemplates } from "@/lib/services/email-templates";
import { TemplateManager } from "@/components/templates/template-manager";

export default async function TemplatesPage() {
  const templates = await listEmailTemplates();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Automation
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Email templates</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Edit tenant notification templates used when admins send compliance emails, accept, or
          reject COI submissions.
        </p>
      </div>

      <TemplateManager initialTemplates={templates} />
    </div>
  );
}

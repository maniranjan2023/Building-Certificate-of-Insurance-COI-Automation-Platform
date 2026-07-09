import { SkeletonPageHeader } from "@/components/skeletons/page-header";

export function TemplatesPageFixture() {
  return (
    <div className="space-y-4">
      <SkeletonPageHeader
        eyebrow="Automation"
        title="Email templates"
        description="Edit tenant notification templates used when admins send compliance emails, accept, or reject COI submissions."
      />
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-1 rounded-lg border bg-card p-2">
          {["receipt_acknowledged", "missing_attachment", "coi_accepted"].map(
            (key) => (
              <div key={key} className="rounded-md px-3 py-2 text-sm">
                {key.replace(/_/g, " ")}
              </div>
            )
          )}
        </aside>
        <section className="rounded-lg border bg-card p-4">
          <div className="mb-3 h-5 w-32 rounded bg-muted" />
          <div className="mb-4 h-9 rounded-md bg-muted/40" />
          <div className="h-40 rounded-md bg-muted/30" />
        </section>
      </div>
    </div>
  );
}

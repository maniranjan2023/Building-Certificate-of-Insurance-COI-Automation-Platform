import { listChecklistItems, ensureDefaultChecklistItems } from "@/lib/services/checklist";
import { ChecklistManager } from "@/components/checklist/checklist-manager";

export default async function ChecklistPage() {
  await ensureDefaultChecklistItems();
  const items = await listChecklistItems(true);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Compliance
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          Editable checklist
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Define what every COI must satisfy. Phase 4 AI agents will validate documents
          against these requirements.
        </p>
      </div>

      <ChecklistManager initialItems={items} />
    </div>
  );
}

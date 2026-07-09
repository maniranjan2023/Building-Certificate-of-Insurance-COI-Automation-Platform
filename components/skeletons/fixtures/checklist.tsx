import { SkeletonPageHeader } from "@/components/skeletons/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ChecklistPageFixture() {
  return (
    <div className="space-y-4">
      <SkeletonPageHeader
        eyebrow="Compliance"
        title="Editable checklist"
        description="Define what every COI must satisfy. Phase 4 AI agents will validate documents against these requirements."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add requirement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-9 rounded-md bg-muted/40" />
          <div className="h-9 rounded-md bg-muted/40" />
          <div className="h-9 w-32 rounded-md bg-muted/60" />
        </CardContent>
      </Card>
      <div className="space-y-3">
        {["Coverage limits", "Additional insured", "Waiver of subrogation"].map(
          (label) => (
            <div key={label} className="rounded-lg border bg-card p-4">
              <p className="text-sm font-medium">{label}</p>
              <p className="mt-1 text-xs text-muted-foreground">Expected: per lease schedule</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

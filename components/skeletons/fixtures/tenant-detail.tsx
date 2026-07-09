import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TenantDetailFixture() {
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted/60" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {["Versions", "Emails sent", "AI steps", "Last activity"].map((label) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">12</p>
          </div>
        ))}
      </div>
      <Card className="gap-3 py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-lg">COI versions</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-10 rounded border bg-muted/20" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

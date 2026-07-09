import { SkeletonPageHeader } from "@/components/skeletons/page-header";

export function TenantsPageFixture() {
  return (
    <div className="space-y-4">
      <SkeletonPageHeader
        eyebrow="Tenants"
        title="Activity log"
        description="Every COI upload, email sent, version change, and AI pipeline step per tenant — from first submission to today."
      />
      <div className="relative max-w-md">
        <div className="h-9 rounded-md border bg-muted/30" />
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Tenant</th>
              <th className="px-4 py-3 font-medium">Versions</th>
              <th className="px-4 py-3 font-medium">Emails</th>
              <th className="px-4 py-3 font-medium">Latest</th>
              <th className="px-4 py-3 font-medium">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <tr key={row} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="h-4 w-36 rounded bg-muted" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-8 rounded bg-muted/70" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-8 rounded bg-muted/70" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-5 w-20 rounded-full bg-muted/70" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-24 rounded bg-muted/50" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { listTenantSummaries } from "@/lib/services/tenant-activity";
import { TenantList } from "@/components/tenants/tenant-list";

export default async function TenantsPage() {
  const tenants = await listTenantSummaries();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Tenants
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Activity log</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Every COI upload, email sent, version change, and AI pipeline step per tenant —
          from first submission to today.
        </p>
      </div>

      <TenantList tenants={tenants} />
    </div>
  );
}

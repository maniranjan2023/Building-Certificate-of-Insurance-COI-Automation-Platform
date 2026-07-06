"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import type { TenantSummary } from "@/lib/services/tenant-activity";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { COI_STATUS_LABELS } from "@/lib/services/version-labels";
import { VersionBadge } from "@/components/ui/version-badge";
import type { CoiStatus } from "@prisma/client";

interface TenantListProps {
  tenants: TenantSummary[];
}

export function TenantList({ tenants }: TenantListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(
      (tenant) =>
        tenant.email.toLowerCase().includes(q) ||
        (tenant.displayName?.toLowerCase().includes(q) ?? false)
    );
  }, [query, tenants]);

  if (tenants.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-12 text-center">
        <Users className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">No tenants yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tenant activity appears when COI submissions are received by email or upload.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by email or name…"
          className="pl-9"
        />
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
            {filtered.map((tenant) => (
              <tr key={tenant.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <Link
                    href={`/tenants/${tenant.id}`}
                    className="font-medium hover:underline"
                  >
                    {tenant.displayName ?? tenant.email}
                  </Link>
                  {tenant.displayName ? (
                    <p className="text-xs text-muted-foreground">{tenant.email}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 tabular-nums">{tenant.versionCount}</td>
                <td className="px-4 py-3 tabular-nums">{tenant.emailCount}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {tenant.latestVersionNumber != null ? (
                      <VersionBadge versionNumber={tenant.latestVersionNumber} />
                    ) : null}
                    {tenant.latestStatus ? (
                      <StatusBadge
                        status={tenant.latestStatus as CoiStatus}
                        label={COI_STATUS_LABELS[tenant.latestStatus as CoiStatus]}
                      />
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {tenant.lastActivityAt ? formatDate(tenant.lastActivityAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No tenants match &ldquo;{query}&rdquo;
          </p>
        ) : null}
      </div>
    </div>
  );
}

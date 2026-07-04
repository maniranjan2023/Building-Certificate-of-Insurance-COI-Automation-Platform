"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CoiStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VersionActionsProps {
  versionId: string;
  currentStatus: CoiStatus;
}

export function VersionActions({ versionId, currentStatus }: VersionActionsProps) {
  const router = useRouter();
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function updateStatus(status: CoiStatus) {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/versions/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          rejectionReason: status === "REJECTED" ? rejectionReason : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Update failed");
      }
      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Update failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <p className="text-sm font-medium">Version actions (Phase 3 testing)</p>
      <p className="text-xs text-muted-foreground">
        Mark rejected to simulate tenant resubmission flow. Full accept/reject emails arrive in Phase 5.
      </p>

      {currentStatus === "REJECTED" ? (
        <p className="text-sm text-red-400">This version is rejected. Upload v{/* next handled in resubmit */} via resubmit form below.</p>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="rejection-reason" className="text-sm">
              Rejection reason
            </Label>
            <Input
              id="rejection-reason"
              className="h-9 text-sm"
              placeholder="Missing additional insured endorsement"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isSubmitting}
            onClick={() => updateStatus("REJECTED")}
          >
            Mark as rejected
          </Button>
        </>
      )}

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

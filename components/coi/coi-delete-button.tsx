"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoiDeleteButtonProps {
  documentId: string;
  fileName: string;
  /** Navigate here after delete (detail page). Omit to refresh in place (table). */
  redirectTo?: string;
  variant?: "destructive" | "outline" | "ghost";
  size?: "xs" | "sm" | "default";
}

export function CoiDeleteButton({
  documentId,
  fileName,
  redirectTo,
  variant = "outline",
  size = "xs",
}: CoiDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${fileName}"?\n\nThis removes the COI, version history, jobs, and AI results. This cannot be undone.`
    );
    if (!confirmed) return;

    setError(null);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/coi/${documentId}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to delete COI");
      }
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete COI"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={isDeleting}
        onClick={handleDelete}
        className={variant === "destructive" ? undefined : "text-red-400 hover:text-red-400"}
      >
        <Trash2 className="size-3" />
        {isDeleting ? "Deleting…" : "Delete"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}

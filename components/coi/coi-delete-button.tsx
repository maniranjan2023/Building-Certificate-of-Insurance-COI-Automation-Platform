"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";
import { useAppToast } from "@/components/providers/app-toast-provider";

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
  const toast = useAppToast();
  const [isDeleting, setIsDeleting] = useState(false);

  async function performDelete() {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/coi/${documentId}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to delete COI");
      }

      toast.success(`"${fileName}" was removed.`, "COI deleted");

      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "Failed to delete COI",
        "Delete failed"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function handleDeleteClick() {
    toast.confirm({
      title: "Delete COI?",
      message: `Delete "${fileName}"? This removes the COI, version history, jobs, and AI results. This cannot be undone.`,
      confirmLabel: "Delete",
      variant: "error",
      onConfirm: () => void performDelete(),
    });
  }

  return (
    <LoadingButton
      type="button"
      variant={variant}
      size={size}
      loading={isDeleting}
      loadingText="Deleting…"
      disabled={isDeleting}
      onClick={handleDeleteClick}
      className={variant === "destructive" ? undefined : "text-red-400 hover:text-red-400"}
    >
      <Trash2 className="size-3" />
      Delete
    </LoadingButton>
  );
}

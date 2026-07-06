"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, RefreshCw } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ResubmitFormProps {
  documentId: string;
  senderEmail: string;
}

export function ResubmitForm({ documentId, senderEmail }: ResubmitFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file) {
      setError("Select a COI file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("senderEmail", senderEmail);

    setIsUploading(true);
    try {
      const response = await fetch(`/api/coi/${documentId}/versions`, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Resubmit failed");
      }

      const newDocId = payload.data?.document?.id;
      const versionNumber = payload.data?.version?.versionNumber;
      setSuccess(`Created v${versionNumber}. Redirecting...`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (newDocId) {
        router.push(`/dashboard/${newDocId}`);
      } else {
        router.refresh();
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Resubmit failed"
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="size-4 text-primary" />
          <h2 className="font-semibold tracking-tight">Upload next version</h2>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Resubmit for {senderEmail}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 p-4">
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            setFile(event.dataTransfer.files[0] ?? null);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 bg-muted/20 hover:border-primary/40"
          )}
        >
          <CloudUpload className="size-6 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">
            {file ? file.name : "Drop updated COI or click to browse"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

        <LoadingButton
          type="submit"
          size="sm"
          className="w-full"
          loading={isUploading}
          loadingText="Uploading…"
          disabled={isUploading}
        >
          Upload next version
        </LoadingButton>
      </form>
    </section>
  );
}

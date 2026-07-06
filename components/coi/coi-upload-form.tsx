"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, FileText, Sparkles } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";
import { useAppToast } from "@/components/providers/app-toast-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CoiUploadFormProps {
  onUploaded?: () => void;
}

export function CoiUploadForm({ onUploaded }: CoiUploadFormProps) {
  const router = useRouter();
  const toast = useAppToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [senderEmail, setSenderEmail] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  function handleFileSelect(selected: File | null) {
    setFile(selected);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files[0] ?? null;
    handleFileSelect(dropped);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      toast.error("Select a COI file to upload.");
      return;
    }

    if (!senderEmail.trim()) {
      toast.error("Tenant email is required for version tracking.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("senderEmail", senderEmail.trim());

    setIsUploading(true);
    try {
      const response = await fetch("/api/coi", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Upload failed");
      }

      const versionNumber = payload.data?.version?.versionNumber ?? 1;
      toast.success(
        `COI v${versionNumber} uploaded and queued for processing.`,
        "Upload complete"
      );
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUploaded?.();
      router.refresh();
    } catch (uploadError) {
      toast.error(
        uploadError instanceof Error ? uploadError.message : "Upload failed"
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_100%_0%,oklch(0.62_0.19_255/0.08),transparent_60%)]"
      />

      <div className="relative p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-xl border bg-primary/10 p-2.5 text-primary">
            <CloudUpload className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold tracking-tight">New submission</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Drop a COI — versions auto-track by tenant email.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sender-email" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tenant email
            </Label>
            <Input
              id="sender-email"
              type="email"
              className="h-10 bg-background/80"
              placeholder="tenant@example.com"
              value={senderEmail}
              onChange={(event) => setSenderEmail(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              COI document
            </Label>
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
              onDrop={handleDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 bg-muted/20 hover:border-primary/40 hover:bg-muted/30"
              )}
            >
              {file ? (
                <>
                  <FileText className="size-8 text-primary" />
                  <p className="mt-2 text-sm font-medium">{file.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Click or drop to replace
                  </p>
                </>
              ) : (
                <>
                  <CloudUpload className="size-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">
                    Drag & drop or click to browse
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PDF, JPEG, PNG, WebP · max 10 MB
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                id="coi-file"
                type="file"
                className="sr-only"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <LoadingButton
            type="submit"
            className="w-full"
            loading={isUploading}
            loadingText="Uploading & queuing AI pipeline…"
            disabled={isUploading}
          >
            <Sparkles className="size-3.5" />
            Upload & process
          </LoadingButton>
        </form>
      </div>
    </section>
  );
}

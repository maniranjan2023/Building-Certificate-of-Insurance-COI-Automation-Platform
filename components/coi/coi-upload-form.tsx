"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CoiUploadForm({ onUploaded }: { onUploaded?: () => void }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

      setSuccess("COI uploaded and queued for processing.");
      setFile(null);
      onUploaded?.();
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed"
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="gap-1 px-4 pb-0">
        <CardTitle className="text-lg">Upload COI</CardTitle>
        <CardDescription className="text-sm">
          Upload a tenant Certificate of Insurance (PDF or image). Files are stored securely in Cloudinary.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="coi-file" className="text-sm">
              COI document
            </Label>
            <Input
              id="coi-file"
              type="file"
              className="h-9 text-sm"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              PDF, JPEG, PNG, or WebP up to 10 MB.
            </p>
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-sm text-emerald-400">
              {success}
            </p>
          ) : null}

          <Button type="submit" size="sm" disabled={isUploading}>
            <Upload className="size-3.5" />
            {isUploading ? "Uploading..." : "Upload COI"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

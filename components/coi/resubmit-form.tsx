"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ResubmitFormProps {
  documentId: string;
  senderEmail: string;
}

export function ResubmitForm({ documentId, senderEmail }: ResubmitFormProps) {
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
    <Card className="gap-3 py-4">
      <CardHeader className="gap-1 px-4 pb-0">
        <CardTitle className="text-lg">Upload new version</CardTitle>
        <CardDescription className="text-sm">
          Resubmit for {senderEmail}. The next version number is assigned automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="resubmit-file" className="text-sm">
              Updated COI document
            </Label>
            <Input
              id="resubmit-file"
              type="file"
              className="h-9 text-sm"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          {success ? (
            <p className="text-sm text-emerald-400">{success}</p>
          ) : null}

          <Button type="submit" size="sm" disabled={isUploading}>
            <Upload className="size-3.5" />
            {isUploading ? "Uploading..." : "Upload next version"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

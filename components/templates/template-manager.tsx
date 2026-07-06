"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EmailTemplate } from "@prisma/client";
import {
  EMAIL_PLACEHOLDER_HINTS,
  EMAIL_PLACEHOLDERS,
  EMAIL_TEMPLATE_LABELS,
} from "@/lib/constants/email-templates";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TemplateManagerProps {
  initialTemplates: EmailTemplate[];
}

export function TemplateManager({ initialTemplates }: TemplateManagerProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedKey, setSelectedKey] = useState(initialTemplates[0]?.key ?? "");
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = templates.find((t) => t.key === selectedKey) ?? templates[0];

  function updateSelected(field: "name" | "subject" | "body", value: string) {
    setTemplates((prev) =>
      prev.map((t) => (t.key === selected.key ? { ...t, [field]: value } : t))
    );
  }

  async function saveTemplate() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/templates/${selected.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selected.name,
          subject: selected.subject,
          body: selected.body,
          enabled: selected.enabled,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Save failed");
      }
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function previewTemplate() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: selected.key }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Preview failed");
      }
      setPreview({ subject: payload.data.subject, body: payload.data.body });
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  if (!selected) {
    return <p className="text-sm text-muted-foreground">No templates found.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <Card className="gap-2 py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-base">Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 px-2 pb-4">
          {templates.map((template) => (
            <button
              key={template.key}
              type="button"
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                template.key === selected.key ? "bg-muted font-medium" : "hover:bg-muted/50"
              }`}
              onClick={() => {
                setSelectedKey(template.key);
                setPreview(null);
              }}
            >
              {EMAIL_TEMPLATE_LABELS[template.key as keyof typeof EMAIL_TEMPLATE_LABELS] ??
                template.name}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="gap-3 py-4">
        <CardHeader className="gap-1 px-4 pb-0">
          <CardTitle className="text-lg">{selected.name}</CardTitle>
          <CardDescription className="text-sm">
            Placeholders:{" "}
            {EMAIL_PLACEHOLDERS.map((p) => `{{${p}}}`).join(", ")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {EMAIL_PLACEHOLDERS.map((placeholder) => (
              <p key={placeholder} className="text-xs text-muted-foreground">
                <code>{`{{${placeholder}}}`}</code> — {EMAIL_PLACEHOLDER_HINTS[placeholder]}
              </p>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-subject">Subject</Label>
            <Input
              id="tpl-subject"
              value={selected.subject}
              onChange={(e) => updateSelected("subject", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-body">Body</Label>
            <textarea
              id="tpl-body"
              className="min-h-[220px] w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
              value={selected.body}
              onChange={(e) => updateSelected("body", e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <LoadingButton
              type="button"
              size="sm"
              loading={busy}
              loadingText="Saving…"
              disabled={busy}
              onClick={() => void saveTemplate()}
            >
              Save template
            </LoadingButton>
            <LoadingButton
              type="button"
              size="sm"
              variant="outline"
              loading={busy}
              loadingText="Loading preview…"
              disabled={busy}
              onClick={() => void previewTemplate()}
            >
              Preview with sample data
            </LoadingButton>
          </div>

          {preview ? (
            <div className="rounded-md border bg-muted/20 p-3 text-sm">
              <p className="font-medium">Subject: {preview.subject}</p>
              <pre className="mt-2 whitespace-pre-wrap font-sans">{preview.body}</pre>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

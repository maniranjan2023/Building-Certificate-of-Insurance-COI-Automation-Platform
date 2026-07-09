"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CoiStatus } from "@prisma/client";
import type { ReportAgentOutput } from "@/lib/ai/schemas";
import {
  EMAIL_TEMPLATE_KEYS,
  EMAIL_TEMPLATE_LABELS,
  type EmailTemplateKey,
} from "@/lib/constants/email-templates";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useAppToast } from "@/components/providers/app-toast-provider";

interface AcceptanceEligibility {
  canAccept: boolean;
  blockers: string[];
  checklistPassed: boolean;
  expiryValid: boolean;
}

interface ReviewActionsPanelProps {
  documentId: string;
  versionId: string;
  currentStatus: CoiStatus;
  initialDraft: ReportAgentOutput | null;
  suggestedTemplate: string | null;
  recipientEmail: string | null;
  jobReady: boolean;
}

function asReport(value: unknown): ReportAgentOutput | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<ReportAgentOutput>;
  return {
    summary: raw.summary ?? "",
    recommendation: raw.recommendation ?? "manual_review",
    recommendationReason: raw.recommendationReason ?? "",
    missingItems: Array.isArray(raw.missingItems) ? raw.missingItems : [],
    matchedItems: Array.isArray(raw.matchedItems) ? raw.matchedItems : [],
    citations: Array.isArray(raw.citations) ? raw.citations : [],
    suggestedEmailBody: raw.suggestedEmailBody ?? "",
    confidenceScore: raw.confidenceScore ?? 0,
  };
}

export function ReviewActionsPanel({
  documentId,
  versionId,
  currentStatus,
  initialDraft,
  suggestedTemplate,
  recipientEmail,
  jobReady,
}: ReviewActionsPanelProps) {
  const router = useRouter();
  const toast = useAppToast();
  const [draft, setDraft] = useState<ReportAgentOutput>(
    initialDraft ?? {
      summary: "",
      recommendation: "manual_review",
      recommendationReason: "",
      missingItems: [],
      matchedItems: [],
      citations: [],
      suggestedEmailBody: "",
      confidenceScore: 0,
    }
  );
  const [eligibility, setEligibility] = useState<AcceptanceEligibility | null>(null);
  const [templateKey, setTemplateKey] = useState<string>(
    suggestedTemplate && EMAIL_TEMPLATE_KEYS.includes(suggestedTemplate as EmailTemplateKey)
      ? suggestedTemplate
      : "clauses_missing"
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [guardrailError, setGuardrailError] = useState<string | null>(null);

  function updateCitation(
    index: number,
    field: "claim" | "quote",
    value: string
  ) {
    setDraft((current) => ({
      ...current,
      citations: current.citations.map((citation, i) =>
        i === index ? { ...citation, [field]: value } : citation
      ),
    }));
  }

  function addCitation() {
    setDraft((current) => ({
      ...current,
      citations: [...current.citations, { claim: "", quote: "" }],
    }));
  }

  function removeCitation(index: number) {
    setDraft((current) => ({
      ...current,
      citations: current.citations.filter((_, i) => i !== index),
    }));
  }

  async function persistDraft() {
    const response = await fetch(`/api/coi/${documentId}/draft-report`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: draft.summary,
        recommendationReason: draft.recommendationReason,
        missingItems: draft.missingItems,
        matchedItems: draft.matchedItems,
        citations: draft.citations,
        suggestedEmailBody: draft.suggestedEmailBody,
      }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error ?? "Save failed");
    }
  }

  const loadReview = useCallback(async () => {
    try {
      const response = await fetch(`/api/coi/${documentId}/review`);
      const payload = await response.json();
      if (payload.success) {
        setEligibility(payload.data.eligibility);
        if (payload.data.draftReport) {
          const parsed = asReport(payload.data.draftReport);
          if (parsed) setDraft(parsed);
        }
        if (payload.data.suggestedTemplate) {
          setTemplateKey(payload.data.suggestedTemplate);
        }
      }
    } catch {
      // Non-blocking — eligibility shown when available
    }
  }, [documentId]);

  useEffect(() => {
    if (jobReady) {
      void loadReview();
    }
  }, [jobReady, loadReview]);

  async function saveDraft() {
    setBusy("save");
    setGuardrailError(null);
    try {
      await persistDraft();
      toast.success("Draft saved.");
      router.refresh();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function sendEmail() {
    setBusy("send");
    setGuardrailError(null);
    try {
      await persistDraft();
      const response = await fetch(`/api/coi/${documentId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey,
          customBody: draft.suggestedEmailBody || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        const message = payload.error ?? "Send failed";
        setGuardrailError(message);
        throw new Error(message);
      }
      toast.success("Email queued for delivery.");
      router.refresh();
    } catch (sendError) {
      toast.error(sendError instanceof Error ? sendError.message : "Send failed");
    } finally {
      setBusy(null);
    }
  }

  async function acceptCoi() {
    setBusy("accept");
    setGuardrailError(null);
    try {
      await persistDraft();
      const response = await fetch(`/api/coi/${documentId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customBody: draft.suggestedEmailBody || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        const message = payload.error ?? "Accept failed";
        setGuardrailError(message);
        throw new Error(message);
      }
      toast.success("COI accepted. Approval email is being sent.");
      router.refresh();
      await loadReview();
    } catch (acceptError) {
      toast.error(acceptError instanceof Error ? acceptError.message : "Accept failed");
    } finally {
      setBusy(null);
    }
  }

  async function rejectCoi() {
    setBusy("reject");
    setGuardrailError(null);
    try {
      const response = await fetch(`/api/coi/${documentId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rejectionReason,
          customBody: draft.suggestedEmailBody || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        const message = payload.error ?? "Reject failed";
        setGuardrailError(message);
        throw new Error(message);
      }
      toast.success("COI rejected. Notification email is being sent.");
      router.refresh();
    } catch (rejectError) {
      toast.error(rejectError instanceof Error ? rejectError.message : "Reject failed");
    } finally {
      setBusy(null);
    }
  }

  if (!jobReady) {
    return (
      <section className="rounded-2xl border bg-card/60 p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Admin review</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Available after AI processing completes.
        </p>
      </section>
    );
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="text-lg font-semibold tracking-tight">Admin review & email</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit the draft, notify the tenant, then accept when checklist and expiration pass.
          {recipientEmail ? ` · ${recipientEmail}` : ""}
        </p>
      </div>
      <div className="space-y-4 p-5">
        {eligibility ? (
          <div
            className={`rounded-md border p-3 text-sm ${
              eligibility.canAccept
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/40 bg-amber-500/10 text-amber-200"
            }`}
          >
            {eligibility.canAccept ? (
              <p>Ready to accept — checklist passed and expiration is valid.</p>
            ) : (
              <div>
                <p className="font-medium">Accept blocked until:</p>
                <ul className="mt-1 list-inside list-disc">
                  {eligibility.blockers.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {guardrailError ? (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            <p className="font-medium">Outbound email blocked by guardrail</p>
            <p className="mt-1">{guardrailError}</p>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="draft-summary">Summary</Label>
          <textarea
            id="draft-summary"
            className="min-h-[72px] w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={draft.summary}
            onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="draft-reason">Recommendation reason</Label>
          <textarea
            id="draft-reason"
            className="min-h-[56px] w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={draft.recommendationReason}
            onChange={(e) =>
              setDraft((d) => ({ ...d, recommendationReason: e.target.value }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="draft-missing">Missing items (one per line)</Label>
          <textarea
            id="draft-missing"
            className="min-h-[72px] w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={draft.missingItems.join("\n")}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                missingItems: e.target.value.split("\n").filter(Boolean),
              }))
            }
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label>Citations (evidence from COI)</Label>
            <Button type="button" size="sm" variant="outline" onClick={addCitation}>
              Add citation
            </Button>
          </div>
          {draft.citations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No citations yet. Add claim + quote pairs from the COI document.
            </p>
          ) : (
            <div className="space-y-3">
              {draft.citations.map((citation, index) => (
                <div key={index} className="space-y-2 rounded-md border bg-muted/20 p-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`citation-claim-${index}`}>Claim</Label>
                    <Input
                      id={`citation-claim-${index}`}
                      className="h-9 text-sm"
                      value={citation.claim}
                      onChange={(e) => updateCitation(index, "claim", e.target.value)}
                      placeholder="General liability minimum $1M"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`citation-quote-${index}`}>Quote from COI</Label>
                    <textarea
                      id={`citation-quote-${index}`}
                      className="min-h-[56px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={citation.quote}
                      onChange={(e) => updateCitation(index, "quote", e.target.value)}
                      placeholder="Each Occurrence: $1,000,000"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeCitation(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="draft-email">Tenant email body</Label>
          <textarea
            id="draft-email"
            className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
            value={draft.suggestedEmailBody}
            onChange={(e) => {
              setGuardrailError(null);
              setDraft((d) => ({ ...d, suggestedEmailBody: e.target.value }));
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="template-key">Email template</Label>
          <NativeSelect
            id="template-key"
            value={templateKey}
            onChange={(e) => setTemplateKey(e.target.value)}
          >
            {EMAIL_TEMPLATE_KEYS.filter((k) =>
              [
                "invalid_document",
                "guardrail_blocked",
                "clauses_missing",
                "all_matched",
                "approved",
                "rejected",
              ].includes(k)
            ).map((key) => (
              <option key={key} value={key}>
                {EMAIL_TEMPLATE_LABELS[key]}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex flex-wrap gap-2">
          <LoadingButton
            type="button"
            size="sm"
            variant="secondary"
            loading={busy === "save"}
            loadingText="Saving…"
            disabled={Boolean(busy)}
            onClick={() => void saveDraft()}
          >
            Save draft
          </LoadingButton>
          <LoadingButton
            type="button"
            size="sm"
            variant="outline"
            loading={busy === "send"}
            loadingText="Queueing…"
            disabled={Boolean(busy) || !recipientEmail}
            onClick={() => void sendEmail()}
          >
            Send email
          </LoadingButton>
          <LoadingButton
            type="button"
            size="sm"
            loading={busy === "accept"}
            loadingText="Accepting…"
            disabled={
              Boolean(busy) ||
              currentStatus === "ACCEPTED" ||
              !eligibility?.canAccept ||
              !recipientEmail
            }
            onClick={() => void acceptCoi()}
          >
            Accept COI
          </LoadingButton>
        </div>

        {currentStatus !== "REJECTED" && currentStatus !== "ACCEPTED" ? (
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="rejection-reason">Rejection reason</Label>
            <Input
              id="rejection-reason"
              className="h-9 text-sm"
              placeholder="Missing additional insured endorsement"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <LoadingButton
              type="button"
              size="sm"
              variant="destructive"
              loading={busy === "reject"}
              loadingText="Rejecting…"
              disabled={Boolean(busy) || !rejectionReason.trim() || !recipientEmail}
              onClick={() => void rejectCoi()}
            >
              Reject & notify tenant
            </LoadingButton>
          </div>
        ) : null}

        {currentStatus === "ACCEPTED" ? (
          <p className="text-sm text-emerald-400">This version has been accepted.</p>
        ) : null}
        {currentStatus === "REJECTED" ? (
          <p className="text-sm text-red-400">
            This version was rejected. Tenant can resubmit using the form below.
          </p>
        ) : null}

        <p className="text-xs text-muted-foreground">Version ID: {versionId}</p>
      </div>
    </section>
  );
}

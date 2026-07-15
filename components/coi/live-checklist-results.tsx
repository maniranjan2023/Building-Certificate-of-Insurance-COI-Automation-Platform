"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChecklistResultsTable,
  parseChecklistResults,
} from "@/components/coi/checklist-results-table";
import type { ChecklistAgentOutput } from "@/lib/ai/schemas";

interface LiveChecklistResultsProps {
  documentId: string;
  initialChecklist: ChecklistAgentOutput | null;
  isPipelineActive: boolean;
}

export function LiveChecklistResults({
  documentId,
  initialChecklist,
  isPipelineActive,
}: LiveChecklistResultsProps) {
  const [checklist, setChecklist] = useState(initialChecklist);

  useEffect(() => {
    setChecklist(initialChecklist);
  }, [initialChecklist]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/coi/${documentId}/pipeline-status`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { version?: { checklistResults?: unknown }; isActive?: boolean };
      };
      if (!payload.success || !payload.data) return;
      const next = parseChecklistResults(payload.data.version?.checklistResults);
      if (next?.items?.length) {
        setChecklist(next);
      }
    } catch {
      // Keep last known checklist on transient errors.
    }
  }, [documentId]);

  useEffect(() => {
    if (!isPipelineActive && checklist?.items.length) return;
    const interval = setInterval(() => {
      void refresh();
    }, 2500);
    return () => clearInterval(interval);
  }, [isPipelineActive, checklist?.items.length, refresh]);

  if (checklist?.items?.length) {
    return <ChecklistResultsTable checklist={checklist} />;
  }

  return (
    <section className="rounded-2xl border border-dashed bg-card/50 px-5 py-8 text-center">
      <h2 className="font-semibold tracking-tight">Checklist results</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isPipelineActive
          ? "Waiting for checklist agent…"
          : "Checklist rows appear after the AI pipeline finishes this submission."}
      </p>
    </section>
  );
}

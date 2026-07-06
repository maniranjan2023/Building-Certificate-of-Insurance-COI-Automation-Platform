"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AgentStepView } from "@/lib/services/pipeline-status";

function formatJson(value: unknown): string {
  if (value == null) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export interface AgentOutputDialogProps {
  step: AgentStepView | null;
  stageLabel?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentOutputDialog({
  step,
  stageLabel,
  open,
  onOpenChange,
}: AgentOutputDialogProps) {
  const title = step?.agentName ?? stageLabel ?? "Pipeline step";
  const failed = step?.guardrailPassed === false || Boolean(step?.tripwireReason);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,820px)] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-6">
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1">
                Raw input and JSON output recorded for this pipeline step
              </DialogDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {step?.modelUsed ? (
                <Badge variant="outline">{step.modelUsed}</Badge>
              ) : null}
              {step?.durationMs != null ? (
                <Badge variant="outline">{step.durationMs}ms</Badge>
              ) : null}
              {failed ? (
                <Badge variant="outline" className="border-red-500/40 text-red-400">
                  Guardrail failed
                </Badge>
              ) : step?.output != null ? (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
                  Completed
                </Badge>
              ) : (
                <Badge variant="outline">Logged</Badge>
              )}
            </div>
          </div>
          {step?.tripwireReason ? (
            <p className="mt-2 text-sm text-red-400">{step.tripwireReason}</p>
          ) : null}
        </DialogHeader>

        <div className="max-h-[calc(min(90vh,820px)-8rem)] overflow-y-auto px-6 py-4">
          {!step ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                {stageLabel
                  ? `${stageLabel} completed without a stored agent payload.`
                  : "No agent output recorded for this step yet."}
              </p>
              {stageLabel ? (
                <p>
                  Worker and queue steps typically do not persist JSON input/output.
                  Select an AI agent step (Document, Extraction, Checklist, Risk, or
                  Report) to view full agent data.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {step.input != null ? (
                <section>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Input
                  </h3>
                  <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
                    {formatJson(step.input)}
                  </pre>
                </section>
              ) : null}
              {step.output != null ? (
                <section>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Output
                  </h3>
                  <pre className="max-h-[min(50vh,420px)] overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
                    {formatJson(step.output)}
                  </pre>
                </section>
              ) : null}
              {step.input == null && step.output == null ? (
                <p className="text-sm text-muted-foreground">
                  This step was logged without stored input or output payloads.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

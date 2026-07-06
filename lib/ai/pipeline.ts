import { AgentStepKind, AiRunStatus } from "@prisma/client";
import {
  getSuggestedTemplate,
  GuardrailTripwireError,
  runChecklistAgent,
  runDocumentAgent,
  runExtractionAgent,
  runReportAgent,
  runRiskAgent,
} from "@/lib/ai/agents";
import { reconcileChecklistResults } from "@/lib/ai/checklist-rules";
import { buildDocumentBundle, parseDocumentBuffer } from "@/lib/ai/llamaparse";
import type { ProcessCoiJobData } from "@/lib/queue/coi-queue";
import {
  completeAiRun,
  failAiRun,
  getOrCreateAiRun,
  persistCoiVersionAiResults,
  recordAgentStep,
  setAiRunCurrentStep,
} from "@/lib/services/ai-run";
import { listChecklistItems } from "@/lib/services/checklist";
import { prisma } from "@/lib/prisma";
import { logError, logInfo, withSpan } from "@/lib/observability/logfire.node";

async function downloadDocumentBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download COI from Cloudinary (${response.status})`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function runTimedStep<T>(
  aiRunId: string,
  stepOrder: number,
  kind: AgentStepKind,
  agentName: string | undefined,
  input: unknown,
  fn: () => Promise<{ result: T; model?: string }>
): Promise<T> {
  const stepLabel = agentName ?? kind.toLowerCase();
  await setAiRunCurrentStep(aiRunId, stepLabel);

  const started = Date.now();
  try {
    const { result, model } = await fn();
    await recordAgentStep(aiRunId, stepOrder, {
      kind,
      agentName,
      modelUsed: model,
      input: input as object,
      output: result as object,
      guardrailPassed: true,
      durationMs: Date.now() - started,
    });
    return result;
  } catch (error) {
    const tripwire =
      error instanceof GuardrailTripwireError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown agent error";

    await recordAgentStep(aiRunId, stepOrder, {
      kind,
      agentName,
      input: input as object,
      guardrailPassed:
        error instanceof GuardrailTripwireError ? false : undefined,
      tripwireReason: tripwire,
      durationMs: Date.now() - started,
    });
    throw error;
  }
}

export interface PipelineResult {
  suggestedTemplate: string;
  stoppedEarly: boolean;
  exitReason?: string;
}

export async function runCoiAiPipeline(
  data: ProcessCoiJobData
): Promise<PipelineResult> {
  return withSpan(
    "coi.pipeline",
    {
      coiJobId: data.coiJobId,
      coiVersionId: data.coiVersionId,
      coiDocumentId: data.coiDocumentId,
    },
    async () => {
      const document = await prisma.coiDocument.findUnique({
        where: { id: data.coiDocumentId },
        include: {
          version: { include: { sender: true } },
        },
      });

      if (!document) {
        logInfo("pipeline.document_deleted", {
          coiDocumentId: data.coiDocumentId,
          coiJobId: data.coiJobId,
        });
        return {
          suggestedTemplate: "invalid_document",
          stoppedEarly: true,
          exitReason: "document_deleted",
        };
      }

      const versionId = data.coiVersionId;
      let aiRun: Awaited<ReturnType<typeof getOrCreateAiRun>> | null = null;
      let stepOrder = 1;

      try {
        aiRun = await getOrCreateAiRun(data.coiJobId, versionId);
        await setAiRunCurrentStep(aiRun.id, "downloading");
        const buffer = await downloadDocumentBuffer(document.cloudinaryUrl);

        const parsed = await runTimedStep(
          aiRun.id,
          stepOrder++,
          AgentStepKind.LLAMAPARSE,
          "llamaparse",
          { fileName: document.fileName, mimeType: document.mimeType },
          async () => {
            const result = await parseDocumentBuffer(
              buffer,
              document.fileName,
              document.mimeType
            );
            return { result, model: "llamaparse" };
          }
        );

        const documentBundle = buildDocumentBundle({
          ocrMarkdown: parsed.markdown,
          emailBody: data.emailBodyText,
        });

        await persistCoiVersionAiResults(versionId, {
          rawOcrText: parsed.text,
        });

        const documentResult = await runTimedStep(
          aiRun.id,
          stepOrder++,
          AgentStepKind.AGENT,
          "document-agent",
          { bundleLength: documentBundle.length },
          async () => {
            const result = await runDocumentAgent(documentBundle);
            return {
              result,
              model: result.model,
            };
          }
        );

        if (!documentResult.isCoi) {
          const suggestedTemplate = getSuggestedTemplate(
            { items: [], mandatoryFailures: [], allPassed: false },
            documentResult
          );
          await completeAiRun(aiRun.id, {
            suggestedTemplate,
            exitReason: "Document classified as non-COI",
          });
          await persistCoiVersionAiResults(versionId, {
            aiSuggestedTemplate: suggestedTemplate,
            draftReport: {
              summary: documentResult.notes ?? "Document does not appear to be a COI.",
              recommendation: "manual_review",
            },
          });
          logInfo("pipeline.stopped_early", {
            reason: "not_coi",
            coiJobId: data.coiJobId,
          });
          return {
            suggestedTemplate,
            stoppedEarly: true,
            exitReason: "not_coi",
          };
        }

        const ocrText = [parsed.text, parsed.markdown].filter(Boolean).join("\n\n");

        const extraction = await runTimedStep(
          aiRun.id,
          stepOrder++,
          AgentStepKind.AGENT,
          "extraction-agent",
          { textLength: ocrText.length },
          async () => {
            const result = await runExtractionAgent(ocrText);
            return { result, model: result.model };
          }
        );

        await persistCoiVersionAiResults(versionId, {
          extractedFields: extraction,
        });

        const checklist = await listChecklistItems(false);
        if (checklist.length === 0) {
          throw new Error(
            "No checklist items in database. Visit /checklist or restart worker to seed defaults."
          );
        }

        const checklistResult = await runTimedStep(
          aiRun.id,
          stepOrder++,
          AgentStepKind.AGENT,
          "checklist-agent",
          { checklistCount: checklist.length },
          async () => {
            const llmResult = await runChecklistAgent(
              extraction,
              checklist,
              ocrText
            );
            const result = reconcileChecklistResults({
              llmResult,
              extraction,
              checklist,
              documentText: ocrText,
            });
            return { result, model: llmResult.model };
          }
        );

        await persistCoiVersionAiResults(versionId, {
          checklistResults: checklistResult,
        });

        const risk = await runTimedStep(
          aiRun.id,
          stepOrder++,
          AgentStepKind.AGENT,
          "risk-agent",
          { mandatoryFailures: checklistResult.mandatoryFailures.length },
          async () => {
            const result = await runRiskAgent(extraction, checklistResult);
            return { result, model: result.model };
          }
        );

        await persistCoiVersionAiResults(versionId, {
          riskAnalysis: risk,
        });

        const report = await runTimedStep(
          aiRun.id,
          stepOrder++,
          AgentStepKind.AGENT,
          "report-agent",
          { recommendationHint: risk.recommendationHint },
          async () => {
            const result = await runReportAgent({
              extraction,
              checklistResult,
              risk,
            });
            return { result, model: result.model };
          }
        );

        const suggestedTemplate = getSuggestedTemplate(
          checklistResult,
          documentResult
        );

        await persistCoiVersionAiResults(versionId, {
          draftReport: report,
          aiSuggestedTemplate: suggestedTemplate,
        });

        await completeAiRun(aiRun.id, {
          suggestedTemplate,
          exitReason: checklistResult.allPassed
            ? "checklist_passed"
            : "checklist_failures",
        });

        logInfo("pipeline.completed", {
          coiJobId: data.coiJobId,
          suggestedTemplate,
          allPassed: checklistResult.allPassed,
        });

        return {
          suggestedTemplate,
          stoppedEarly: false,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Pipeline failed unexpectedly";
        const status =
          error instanceof GuardrailTripwireError
            ? AiRunStatus.STOPPED_EARLY
            : AiRunStatus.FAILED;

        if (aiRun) {
          await failAiRun(aiRun.id, message, status);
        }
        logError("pipeline.failed", error, { coiJobId: data.coiJobId });
        throw error;
      }
    }
  );
}

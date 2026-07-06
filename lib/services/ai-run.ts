import {
  AgentStepKind,
  AiRunStatus,
  Prisma,
  type AgentStep,
  type AiRun,
  type Prisma as PrismaTypes,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AiRunWithSteps = PrismaTypes.AiRunGetPayload<{
  include: { steps: { orderBy: { stepOrder: "asc" } } };
}>;

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function aiRunResetData(coiVersionId: string): PrismaTypes.AiRunUpdateInput {
  return {
    coiVersionId,
    status: AiRunStatus.RUNNING,
    startedAt: new Date(),
    completedAt: null,
    exitReason: null,
    currentStepLabel: null,
    suggestedTemplate: null,
  };
}

async function resetExistingAiRun(
  existing: AiRun,
  coiVersionId: string
): Promise<AiRun> {
  await prisma.agentStep.deleteMany({ where: { aiRunId: existing.id } });
  return prisma.aiRun.update({
    where: { id: existing.id },
    data: aiRunResetData(coiVersionId),
  });
}

export async function getOrCreateAiRun(
  coiJobId: string,
  coiVersionId: string
): Promise<AiRun> {
  const existing = await prisma.aiRun.findUnique({ where: { coiJobId } });
  if (existing) {
    return resetExistingAiRun(existing, coiVersionId);
  }

  try {
    return await prisma.aiRun.create({
      data: {
        coiJobId,
        coiVersionId,
        status: AiRunStatus.RUNNING,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
    const raced = await prisma.aiRun.findUnique({ where: { coiJobId } });
    if (!raced) {
      throw error;
    }
    return resetExistingAiRun(raced, coiVersionId);
  }
}

/** @deprecated Use getOrCreateAiRun — supports BullMQ retries without unique constraint errors. */
export async function createAiRun(
  coiJobId: string,
  coiVersionId: string
): Promise<AiRun> {
  return getOrCreateAiRun(coiJobId, coiVersionId);
}

export async function getAiRunForJob(
  coiJobId: string
): Promise<AiRunWithSteps | null> {
  return prisma.aiRun.findUnique({
    where: { coiJobId },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });
}

export async function getLatestAiRunForVersion(
  coiVersionId: string
): Promise<AiRunWithSteps | null> {
  return prisma.aiRun.findFirst({
    where: { coiVersionId },
    orderBy: { startedAt: "desc" },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });
}

export async function recordAgentStep(
  aiRunId: string,
  stepOrder: number,
  data: {
    kind: AgentStepKind;
    agentName?: string;
    modelUsed?: string;
    input?: PrismaTypes.InputJsonValue;
    output?: PrismaTypes.InputJsonValue;
    guardrailPassed?: boolean;
    tripwireReason?: string;
    durationMs?: number;
  }
): Promise<AgentStep> {
  return prisma.agentStep.create({
    data: {
      aiRunId,
      stepOrder,
      kind: data.kind,
      agentName: data.agentName ?? null,
      modelUsed: data.modelUsed ?? null,
      input: data.input ?? undefined,
      output: data.output ?? undefined,
      guardrailPassed: data.guardrailPassed ?? null,
      tripwireReason: data.tripwireReason ?? null,
      durationMs: data.durationMs ?? null,
    },
  });
}

export async function setAiRunCurrentStep(
  aiRunId: string,
  currentStepLabel: string
): Promise<void> {
  await prisma.aiRun.update({
    where: { id: aiRunId },
    data: { currentStepLabel },
  });
}

export async function clearAiRunCurrentStep(aiRunId: string): Promise<void> {
  await prisma.aiRun.update({
    where: { id: aiRunId },
    data: { currentStepLabel: null },
  });
}

export async function completeAiRun(
  aiRunId: string,
  data: {
    suggestedTemplate?: string;
    exitReason?: string;
  }
): Promise<AiRun> {
  return prisma.aiRun.update({
    where: { id: aiRunId },
    data: {
      status: AiRunStatus.COMPLETED,
      completedAt: new Date(),
      suggestedTemplate: data.suggestedTemplate ?? null,
      exitReason: data.exitReason ?? null,
      currentStepLabel: null,
    },
  });
}

export async function failAiRun(
  aiRunId: string,
  exitReason: string,
  status: AiRunStatus = AiRunStatus.FAILED,
  options?: { suggestedTemplate?: string | null }
): Promise<AiRun> {
  return prisma.aiRun.update({
    where: { id: aiRunId },
    data: {
      status,
      completedAt: new Date(),
      exitReason,
      currentStepLabel: null,
      suggestedTemplate: options?.suggestedTemplate ?? undefined,
    },
  });
}

export async function persistCoiVersionAiResults(
  coiVersionId: string,
  data: {
    rawOcrText?: string;
    extractedFields?: PrismaTypes.InputJsonValue;
    checklistResults?: PrismaTypes.InputJsonValue;
    riskAnalysis?: PrismaTypes.InputJsonValue;
    draftReport?: PrismaTypes.InputJsonValue;
    aiSuggestedTemplate?: string;
    fieldBoundingBoxes?: PrismaTypes.InputJsonValue;
  }
): Promise<void> {
  await prisma.coiVersion.update({
    where: { id: coiVersionId },
    data: {
      rawOcrText: data.rawOcrText,
      extractedFields: data.extractedFields,
      checklistResults: data.checklistResults,
      riskAnalysis: data.riskAnalysis,
      draftReport: data.draftReport,
      aiSuggestedTemplate: data.aiSuggestedTemplate,
      fieldBoundingBoxes: data.fieldBoundingBoxes,
    },
  });
}

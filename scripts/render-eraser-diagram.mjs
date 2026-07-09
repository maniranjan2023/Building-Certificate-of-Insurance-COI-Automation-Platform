import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dsl = `direction down
colorMode bold
styleMode shadow
typeface clean

Tenant [icon: user, color: blue]
Admin [icon: user, color: green]

Intake [color: blue] {
  AgentMail [icon: email]
  Webhook [label: "POST /api/webhooks/agentmail", icon: api]
  DashboardUpload [label: "POST /api/coi upload", icon: upload]
}

NextJS [label: "Next.js 15 COI Platform", icon: next-js, color: green] {
  AdminUI [label: "Dashboard, COI Detail, Templates, Checklist, Tenants", icon: browser]
  APIRoutes [label: "REST API auth coi jobs templates tenants", icon: api]
}

Data [color: blue] {
  NeonPostgres [label: "Neon Postgres Prisma", icon: postgresql]
  Cloudinary [icon: cloud]
}

QueueLayer [color: red] {
  UpstashRedis [label: "Upstash Redis", icon: redis]
  CoiJobs [label: "coi-jobs queue", icon: queue]
  CoiDLQ [label: "coi-jobs-dlq", icon: queue]
}

BullMQWorker [label: "npm run worker", icon: server, color: orange] {
  ProcessCoi [label: "process-coi", icon: cog]
  SendTemplate [label: "send-template-email", icon: mail]
}

AIPipeline [icon: brain, color: purple] {
  LlamaParse [label: "LlamaParse OCR", icon: file-text]
  Agent1 [label: "Agent 1 Document Classifier", icon: robot]
  Agent2 [label: "Agent 2 Field Extraction", icon: robot]
  Agent3 [label: "Agent 3 Checklist Compliance", icon: robot]
  Agent4 [label: "Agent 4 Risk Analysis", icon: robot]
  Agent5 [label: "Agent 5 Report Generator", icon: robot]
  Guardrails [label: "Input Output Guardrails", icon: shield]
}

GroqLLM [label: "Groq LLM", icon: ai, color: purple]

Tenant > AgentMail: "COI PDF email"
AgentMail > Webhook
Webhook > APIRoutes
Admin > AdminUI
Admin > DashboardUpload
DashboardUpload > APIRoutes
APIRoutes > NeonPostgres
APIRoutes > Cloudinary
APIRoutes > CoiJobs: "enqueue process-coi"
CoiJobs > ProcessCoi
ProcessCoi > Cloudinary: "download PDF"
ProcessCoi > LlamaParse
LlamaParse > Agent1 > Agent2 > Agent3 > Agent4 > Agent5
Agent1, Agent2, Agent3, Agent4, Agent5 > GroqLLM
ProcessCoi > Guardrails
ProcessCoi > NeonPostgres: "AiRun AgentStep CoiVersion"
ProcessCoi > AdminUI: "READY_FOR_REVIEW"
AdminUI > SendTemplate: "Accept Reject Send"
SendTemplate > AgentMail: "templated email"
SendTemplate > NeonPostgres: "OutboundEmail"
AgentMail > Tenant: "compliance reply"
CoiJobs > CoiDLQ: "failed retries"`;

const payload = {
  elements: [
    {
      type: "diagram",
      id: "coi-platform-architecture",
      diagramType: "cloud-architecture-diagram",
      code: dsl,
    },
  ],
  scale: 1,
  theme: "dark",
  background: true,
};

async function renderElements() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 240000);

  try {
    const res = await fetch("https://app.eraser.io/api/render/elements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Skill-Source": "cursor",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await res.text();
    console.log("STATUS", res.status);
    console.log(text);
    fs.writeFileSync(
      path.join(__dirname, "eraser-response.json"),
      text,
      "utf8"
    );
  } catch (err) {
    console.error("ERROR", err.message);
    process.exit(1);
  } finally {
    clearTimeout(timeout);
  }
}

renderElements();

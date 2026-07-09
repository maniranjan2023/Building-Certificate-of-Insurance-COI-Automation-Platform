export type AutoEmailTemplate =
  | "missing_attachment"
  | "receipt_acknowledged"
  | "processing_error";

export interface TemplateRenderContext {
  senderEmail: string;
  senderName?: string | null;
  versionNumber?: number;
  submissionDate?: Date;
}

const DEFAULT_TEMPLATES: Record<
  AutoEmailTemplate,
  { subject: string; body: string }
> = {
  missing_attachment: {
    subject: "COI submission — attachment missing",
    body: `Hello,

We received your email but could not find a Certificate of Insurance (PDF or image) attached.

Please reply to this message with your COI document attached so we can begin review.

Thank you.`,
  },
  receipt_acknowledged: {
    subject: "COI received — processing started",
    body: `Hello,

We received your Certificate of Insurance and have started automated review.

You will receive another message once our team completes the compliance check.

Thank you.`,
  },
  processing_error: {
    subject: "COI processing issue",
    body: `Hello,

We encountered an error while processing your Certificate of Insurance.

Please resubmit your COI as a clear PDF attachment, or contact our office if the issue continues.

Thank you.`,
  },
};

export function renderAutoIntakeTemplate(
  template: AutoEmailTemplate,
  context: TemplateRenderContext
): { subject: string; text: string } {
  const base = DEFAULT_TEMPLATES[template];
  const greeting = context.senderName?.trim()
    ? `Hello ${context.senderName},`
    : "Hello,";

  let text = base.body.replace(/^Hello,/m, greeting);
  if (context.versionNumber) {
    text += `\n\nReference: COI version v${context.versionNumber}`;
  }
  if (context.submissionDate) {
    text += `\nReceived: ${context.submissionDate.toISOString().slice(0, 10)}`;
  }

  return { subject: base.subject, text };
}

const URL_PATTERN = /https?:\/\/[^\s]+/gi;
const PAYMENT_PATTERNS = [
  /\bwire\s+transfer\b/i,
  /\bbank\s+account\b/i,
  /\brouting\s+number\b/i,
  /\bswift\s+code\b/i,
  /\bvenmo\b/i,
  /\bzelle\b/i,
  /\bcrypto\s*wallet\b/i,
  /\bsend\s+payment\s+to\b/i,
];

export function sanitizeTemplateVariable(value: string, maxLength = 500): string {
  let text = value
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(URL_PATTERN, "[link removed]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

  for (const pattern of PAYMENT_PATTERNS) {
    if (pattern.test(text)) {
      text = text.replace(pattern, "[payment instruction removed]");
    }
  }

  return text;
}

export function sanitizeSuggestedEmailBody(body: string): string {
  return sanitizeTemplateVariable(body, 4000);
}

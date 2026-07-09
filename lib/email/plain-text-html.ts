export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function textToHtml(text: string): string {
  const escaped = escapeHtml(text);
  const withBreaks = escaped.replace(/\r\n/g, "\n").replace(/\n/g, "<br />\n");
  return `<html><body style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#111;margin:0;padding:16px;">${withBreaks}</body></html>`;
}

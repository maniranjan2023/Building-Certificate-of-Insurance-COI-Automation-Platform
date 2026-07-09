export function sanitizeDownloadFilename(fileName: string, fallback = "document.pdf"): string {
  const base = fileName
    .normalize("NFKC")
    .replace(/[^\w.\-() ]+/g, "_")
    .replace(/[\r\n"]/g, "")
    .trim()
    .slice(0, 120);

  return base || fallback;
}

export function contentDispositionInline(fileName: string): string {
  const safe = sanitizeDownloadFilename(fileName);
  const encoded = encodeURIComponent(safe);
  return `inline; filename="${safe}"; filename*=UTF-8''${encoded}`;
}

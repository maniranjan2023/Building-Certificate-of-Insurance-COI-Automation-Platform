"use client";

import dynamic from "next/dynamic";

const CoiPdfViewerInner = dynamic(
  () => import("./coi-pdf-viewer").then((mod) => mod.CoiPdfViewer),
  {
    ssr: false,
    loading: () => (
      <p className="rounded-lg border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        Loading PDF preview…
      </p>
    ),
  }
);

interface CoiPdfViewerProps {
  pdfUrl: string;
  fileName: string;
}

export function CoiPdfViewer(props: CoiPdfViewerProps) {
  return <CoiPdfViewerInner {...props} />;
}

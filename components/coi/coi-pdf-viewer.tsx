"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface CoiPdfViewerProps {
  pdfUrl: string;
  fileName: string;
}

export function CoiPdfViewer({ pdfUrl }: CoiPdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const pageWidth = Math.max(320, containerWidth - 24);

  const pdfFile = useMemo(
    () => ({ url: pdfUrl, withCredentials: true as const }),
    [pdfUrl]
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width > 0) setContainerWidth(width);
    });

    observer.observe(node);
    setContainerWidth(node.clientWidth);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-w-0 space-y-3">
      <div
        ref={containerRef}
        className="max-h-[75vh] max-w-full overflow-auto rounded-xl border bg-muted/30 p-3"
      >
        <Document
          file={pdfFile}
          onLoadSuccess={({ numPages: pages }) => {
            setLoadError(null);
            setNumPages(pages);
          }}
          onLoadError={(error) => {
            setLoadError(error.message ?? "Unknown PDF load error");
          }}
          loading={<p className="p-4 text-sm text-muted-foreground">Loading PDF…</p>}
          error={
            <p className="p-4 text-sm text-red-400">
              Could not load PDF preview
              {loadError ? `: ${loadError}` : ""}. Use Open in Cloudinary to view the file.
            </p>
          }
        >
          {Array.from({ length: numPages }, (_, index) => {
            const pageNumber = index + 1;

            return (
              <div key={pageNumber} className="mb-6 last:mb-2">
                <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
                  Page {pageNumber} of {numPages}
                </p>
                <div className="mx-auto w-fit max-w-full rounded border bg-white shadow-sm">
                  <Page
                    pageNumber={pageNumber}
                    width={pageWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </div>
              </div>
            );
          })}
        </Document>
      </div>
    </div>
  );
}

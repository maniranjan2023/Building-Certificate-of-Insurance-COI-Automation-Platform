import LlamaCloud from "@llamaindex/llama-cloud";
import { cloudBBoxToTextItem } from "@/lib/ai/visual-citations";
import { getEnv, getLlamaCloudApiKey } from "@/lib/env";
import { withSpan } from "@/lib/observability/logfire.node";
import type { ParseLayoutPage, TextItem } from "@/lib/types/field-bboxes";

let client: LlamaCloud | null = null;

function getLlamaClient(): LlamaCloud {
  if (!client) {
    client = new LlamaCloud({ apiKey: getLlamaCloudApiKey() });
  }
  return client;
}

export interface ParsedDocument {
  markdown: string;
  text: string;
  /** Spatial text items per page (LiteParse-compatible for visual citations). */
  layoutPages: ParseLayoutPage[];
}

type LayoutBBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string | null;
  start_index?: number;
  end_index?: number;
};

type LayoutItem = {
  type?: string;
  value?: string;
  md?: string;
  bbox?: LayoutBBox[] | null;
  items?: LayoutItem[];
};

/**
 * Expand LlamaParse items into LiteParse-compatible textItems.
 * When granular_bboxes is enabled, each bbox slice becomes its own textItem
 * (see https://developers.llamaindex.ai/liteparse/guides/visual-citations/).
 */
function pushGranularTextItems(
  sourceText: string,
  bboxes: LayoutBBox[],
  acc: TextItem[],
  pageHeight: number
): boolean {
  const indexed = bboxes.filter(
    (box) =>
      box.start_index !== undefined &&
      box.end_index !== undefined &&
      box.end_index > box.start_index &&
      box.w > 0 &&
      box.h > 0
  );

  if (indexed.length === 0) return false;

  const skipWholeTable = indexed.some((box) => box.label !== "table");

  for (const box of indexed) {
    if (skipWholeTable && box.label === "table") continue;

    const slice = sourceText.slice(box.start_index!, box.end_index!).trim();
    if (!slice) continue;

    acc.push(cloudBBoxToTextItem(slice, box, pageHeight));
  }

  return indexed.length > 0;
}

function flattenTextItems(
  items: LayoutItem[],
  acc: TextItem[],
  pageHeight: number
): void {
  for (const item of items) {
    const sourceText = item.value ?? item.md ?? "";

    if (sourceText && item.bbox?.length) {
      const expanded = pushGranularTextItems(sourceText, item.bbox, acc, pageHeight);
      if (!expanded) {
        const text = sourceText.trim();
        const box = item.bbox[0];
        if (text && box) {
          acc.push(cloudBBoxToTextItem(text, box, pageHeight));
        }
      }
    }

    if (item.items?.length) {
      flattenTextItems(item.items, acc, pageHeight);
    }
  }
}

function extractLayoutPages(result: {
  items?: {
    pages?: Array<
      | {
          success: true;
          page_number: number;
          page_width: number;
          page_height: number;
          items: LayoutItem[];
        }
      | { success: false; page_number: number }
    >;
  } | null;
}): ParseLayoutPage[] {
  const pages = result.items?.pages ?? [];
  const layoutPages: ParseLayoutPage[] = [];

  for (const page of pages) {
    if (!page.success) continue;
    const textItems: TextItem[] = [];
    flattenTextItems(page.items, textItems, page.page_height);
    layoutPages.push({
      pageNumber: page.page_number,
      pageWidth: page.page_width,
      pageHeight: page.page_height,
      textItems,
    });
  }

  return layoutPages;
}

export async function parseDocumentBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ParsedDocument> {
  return withSpan("llamaparse.parse", { fileName, mimeType }, async () => {
    const env = getEnv();
    const llama = getLlamaClient();
    const uploadFile = new File([new Uint8Array(buffer)], fileName, { type: mimeType });

    const result = await llama.parsing.parse(
      {
        tier: env.LLAMAPARSE_TIER as "agentic" | "fast" | "cost_effective",
        version: "latest",
        upload_file: uploadFile,
        expand: ["markdown", "text", "items"],
        output_options: {
          granular_bboxes: ["word", "line"],
        },
      },
      { verbose: true }
    );

    const markdown =
      typeof result.markdown === "string"
        ? result.markdown
        : result.markdown?.pages
            ?.map((page) => {
              const p = page as { md?: string; text?: string };
              return p.md ?? p.text ?? "";
            })
            .join("\n\n") ?? "";
    const text =
      typeof result.text === "string"
        ? result.text
        : result.text?.pages
            ?.map((page) => {
              const p = page as { text?: string };
              return p.text ?? "";
            })
            .join("\n\n") ?? markdown;

    if (!markdown && !text) {
      throw new Error("LlamaParse returned empty content");
    }

    return {
      markdown: markdown || text,
      text: text || markdown,
      layoutPages: extractLayoutPages(result),
    };
  });
}

export function buildDocumentBundle(options: {
  ocrMarkdown: string;
  emailBody?: string | null;
}): string {
  const parts = [`=== COI DOCUMENT (OCR) ===\n${options.ocrMarkdown.trim()}`];
  if (options.emailBody?.trim()) {
    parts.push(`=== EMAIL BODY ===\n${options.emailBody.trim()}`);
  }
  return parts.join("\n\n");
}

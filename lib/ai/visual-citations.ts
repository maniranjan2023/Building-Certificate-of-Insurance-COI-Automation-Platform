/**
 * Visual citation helpers aligned with LiteParse bounding-box docs:
 * https://developers.llamaindex.ai/liteparse/guides/visual-citations/
 *
 * Pure JS — no @llamaindex/liteparse import (ESM-only; breaks tsx worker).
 */
import type { ParseLayoutPage, TextItem } from "@/lib/types/field-bboxes";

export interface SearchItemsOptions {
  phrase: string;
  caseSensitive?: boolean;
}

/** Same API as LiteParse `searchItems` — phrase match on textItems (incl. adjacent items). */
export function searchItems(items: TextItem[], options: SearchItemsOptions): TextItem[] {
  const phrase = options.phrase.trim();
  if (!phrase) return [];

  const needle = options.caseSensitive ? phrase : phrase.toLowerCase();

  const single = items.filter((item) => {
    const hay = options.caseSensitive ? item.text : item.text.toLowerCase();
    return hay.includes(needle);
  });
  if (single.length) return single;

  // OCR often truncates trailing characters (e.g. "$1,000,00", "Each Occurrenc").
  if (needle.length >= 4) {
    const prefix = needle.slice(0, Math.max(4, needle.length - 2));
    const prefixHits = items.filter((item) => {
      const hay = options.caseSensitive ? item.text : item.text.toLowerCase();
      return hay.includes(prefix);
    });
    if (prefixHits.length) return prefixHits;
  }

  // Phrase may span adjacent text items (LiteParse docs tip).
  for (let i = 0; i < items.length; i++) {
    let combined = "";
    const group: TextItem[] = [];
    for (let j = i; j < Math.min(i + 6, items.length); j++) {
      combined += (combined ? " " : "") + items[j].text;
      group.push(items[j]);
      const hay = options.caseSensitive ? combined : combined.toLowerCase();
      if (hay.includes(needle)) {
        const united = unionTextItems(group);
        return united ? [united] : group;
      }
    }
  }

  return [];
}

/** Merge multiple text items into one highlight region. */
export function unionTextItems(items: TextItem[]): TextItem | null {
  if (!items.length) return null;
  if (items.length === 1) return items[0];

  const x = Math.min(...items.map((i) => i.x));
  const y = Math.min(...items.map((i) => i.y));
  const right = Math.max(...items.map((i) => i.x + i.width));
  const bottom = Math.max(...items.map((i) => i.y + i.height));

  return {
    text: items.map((i) => i.text).join(" "),
    x,
    y,
    width: right - x,
    height: bottom - y,
  };
}

export interface LocatedTextItem extends TextItem {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
}

export function findPhraseInLayout(
  pages: ParseLayoutPage[],
  phrase: string,
  options?: { caseSensitive?: boolean }
): LocatedTextItem | null {
  const trimmed = phrase.trim();
  if (!trimmed) return null;

  for (const page of pages) {
    const matches = searchItems(page.textItems, {
      phrase: trimmed,
      caseSensitive: options?.caseSensitive ?? false,
    });
    if (!matches.length) continue;

    const united = unionTextItems(matches) ?? matches[0];
    return {
      ...united,
      pageNumber: page.pageNumber,
      pageWidth: page.pageWidth,
      pageHeight: page.pageHeight,
    };
  }

  return null;
}

export function findFirstPhraseInLayout(
  pages: ParseLayoutPage[],
  phrases: Array<string | null | undefined>
): LocatedTextItem | null {
  for (const phrase of phrases) {
    const hit = findPhraseInLayout(pages, phrase ?? "");
    if (hit) return hit;
  }
  return null;
}

export function findValueNearLabel(
  page: ParseLayoutPage,
  labelPattern: RegExp,
  valuePattern: RegExp
): LocatedTextItem | null {
  const labelItems = page.textItems.filter((item) => labelPattern.test(item.text));
  if (!labelItems.length) return null;

  let best: LocatedTextItem | null = null;
  let bestScore = 0;

  for (const label of labelItems) {
    for (const item of page.textItems) {
      if (!valuePattern.test(item.text)) continue;
      const dy = Math.abs(item.y - label.y);
      const dx = Math.abs(item.x - label.x);
      const score = 100 - dy - dx * 0.05;
      if (score > bestScore) {
        bestScore = score;
        best = {
          ...item,
          pageNumber: page.pageNumber,
          pageWidth: page.pageWidth,
          pageHeight: page.pageHeight,
        };
      }
    }
  }

  return best;
}

export function findNearLabelInLayout(
  pages: ParseLayoutPage[],
  labelPattern: RegExp,
  valuePattern: RegExp
): LocatedTextItem | null {
  for (const page of pages) {
    const hit = findValueNearLabel(page, labelPattern, valuePattern);
    if (hit) return hit;
  }
  return null;
}

/** Same-row pairing for table limits/dates (LiteParse visual citation pattern). */
export function findValueOnSameRowInLayout(
  pages: ParseLayoutPage[],
  labelPattern: RegExp,
  valuePattern: RegExp,
  yTolerance = 6
): LocatedTextItem | null {
  for (const page of pages) {
    const labels = page.textItems.filter((item) => labelPattern.test(item.text));
    for (const label of labels) {
      let best: LocatedTextItem | null = null;
      let bestDx = Infinity;

      for (const item of page.textItems) {
        if (!valuePattern.test(item.text)) continue;
        if (Math.abs(item.y - label.y) > yTolerance) continue;
        const dx = Math.abs(item.x - label.x);
        if (dx < bestDx) {
          bestDx = dx;
          best = {
            ...item,
            pageNumber: page.pageNumber,
            pageWidth: page.pageWidth,
            pageHeight: page.pageHeight,
          };
        }
      }

      if (best) return best;
    }
  }

  return null;
}

export function findAllPhrasesInLayout(
  pages: ParseLayoutPage[],
  phrases: Array<string | null | undefined>
): LocatedTextItem[] {
  const hits: LocatedTextItem[] = [];
  const seen = new Set<string>();

  for (const phrase of phrases) {
    const hit = findPhraseInLayout(pages, phrase ?? "");
    if (!hit) continue;
    const key = `${hit.pageNumber}:${hit.x}:${hit.y}:${hit.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push(hit);
  }

  return hits;
}

export function findLabelInLayout(
  pages: ParseLayoutPage[],
  labelPattern: RegExp
): LocatedTextItem | null {
  for (const page of pages) {
    for (const item of page.textItems) {
      if (!labelPattern.test(item.text)) continue;
      return {
        ...item,
        pageNumber: page.pageNumber,
        pageWidth: page.pageWidth,
        pageHeight: page.pageHeight,
      };
    }
  }
  return null;
}

/** Pick the smallest matching textItem — avoids whole-table / paragraph blocks. */
export function findMatchingItemInLayout(
  pages: ParseLayoutPage[],
  pattern: RegExp,
  options?: { preferSmallest?: boolean; maxArea?: number }
): LocatedTextItem | null {
  const preferSmallest = options?.preferSmallest ?? true;
  const maxArea = options?.maxArea ?? Infinity;
  let best: LocatedTextItem | null = null;
  let bestArea = Infinity;

  for (const page of pages) {
    for (const item of page.textItems) {
      if (!pattern.test(item.text)) continue;
      const area = item.width * item.height;
      if (area > maxArea) continue;

      if (!preferSmallest) {
        return {
          ...item,
          pageNumber: page.pageNumber,
          pageWidth: page.pageWidth,
          pageHeight: page.pageHeight,
        };
      }

      if (area < bestArea) {
        bestArea = area;
        best = {
          ...item,
          pageNumber: page.pageNumber,
          pageWidth: page.pageWidth,
          pageHeight: page.pageHeight,
        };
      }
    }
  }

  return best;
}

export function cloudBBoxToTextItem(
  text: string,
  box: { x: number; y: number; w: number; h: number },
  _pageHeight?: number
): TextItem {
  return {
    text,
    x: box.x,
    y: box.y,
    width: box.w,
    height: box.h,
  };
}

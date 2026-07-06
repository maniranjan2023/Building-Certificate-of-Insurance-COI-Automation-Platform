/**
 * LiteParse-compatible spatial text item.
 * @see https://developers.llamaindex.ai/liteparse/guides/visual-citations/
 */
export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** LiteParse visual citation — PDF points, top-left origin. */
export interface FieldBoundingBox {
  fieldKey: string;
  label: string;
  mandatory: boolean;
  status: "PASS" | "FAIL" | "MISSING";
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
  matchedText: string;
}

export type FieldBoundingBoxList = FieldBoundingBox[];

/** One page of spatial text from LlamaParse `items` expand. */
export interface ParseLayoutPage {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  textItems: TextItem[];
}

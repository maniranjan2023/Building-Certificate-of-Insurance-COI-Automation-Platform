/** PDF-point → rendered pixel conversion (LiteParse visual citations spec). */
export interface PdfPointRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RenderRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Scale PDF points to rendered pixels.
 * @see https://developers.llamaindex.ai/liteparse/guides/visual-citations/
 */
export function pdfPointsToRenderRect(
  item: PdfPointRect,
  pageWidthPoints: number,
  renderWidthPx: number
): RenderRect {
  const scale = renderWidthPx / pageWidthPoints;
  return {
    left: item.x * scale,
    top: item.y * scale,
    width: item.width * scale,
    height: item.height * scale,
  };
}

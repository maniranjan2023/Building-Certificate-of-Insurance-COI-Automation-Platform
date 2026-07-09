/** Authenticated COI asset URL served by the app (session required). */
export function coiAssetApiPath(documentId: string): string {
  return `/api/coi/${documentId}/asset`;
}

/** PDF proxy URL for react-pdf viewer (session required). */
export function coiPdfApiPath(documentId: string): string {
  return `/api/coi/${documentId}/pdf`;
}

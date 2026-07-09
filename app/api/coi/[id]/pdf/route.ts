import { getCoiDocumentById } from "@/lib/services/coi";
import { resolveCoiAssetUrl } from "@/lib/services/cloudinary";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";
import { contentDispositionInline } from "@/lib/security/safe-filename";
import { jsonInternalError } from "@/lib/api/handle-route-error";
import { NextResponse } from "next/server";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Proxy PDF bytes so react-pdf can load without Cloudinary CORS issues. */
export async function GET(_request: Request, { params }: RouteParams) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) {
    return session;
  }

  const { id } = await params;
  const document = await getCoiDocumentById(id);

  if (!document || document.mimeType !== "application/pdf") {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }

  try {
    const signedUrl = resolveCoiAssetUrl(
      document.cloudinaryPublicId,
      document.cloudinaryUrl
    );
    const upstream = await fetch(signedUrl);
    if (!upstream.ok) {
      return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 502 });
    }

    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDispositionInline(document.fileName),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return jsonInternalError(error, "coi.pdf");
  }
}

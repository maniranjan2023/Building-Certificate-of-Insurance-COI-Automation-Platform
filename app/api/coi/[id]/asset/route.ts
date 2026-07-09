import { getCoiDocumentById } from "@/lib/services/coi";
import { resolveCoiAssetUrl } from "@/lib/services/cloudinary";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Redirect to a short-lived signed Cloudinary URL (authenticated assets). */
export async function GET(_request: Request, { params }: RouteParams) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) {
    return session;
  }

  const { id } = await params;
  const document = await getCoiDocumentById(id);

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const signedUrl = resolveCoiAssetUrl(
    document.cloudinaryPublicId,
    document.cloudinaryUrl
  );

  return NextResponse.redirect(signedUrl);
}

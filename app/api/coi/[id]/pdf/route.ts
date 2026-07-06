import { getCoiDocumentById } from "@/lib/services/coi";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Proxy PDF bytes so react-pdf can load without Cloudinary CORS issues. */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const document = await getCoiDocumentById(id);

  if (!document || document.mimeType !== "application/pdf") {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }

  const upstream = await fetch(document.cloudinaryUrl);
  if (!upstream.ok) {
    return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 502 });
  }

  const buffer = await upstream.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${document.fileName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

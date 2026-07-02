import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getCoiDocumentById, COI_STATUS_LABELS } from "@/lib/services/coi";
import { formatBytes, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CoiDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CoiDetailPage({ params }: CoiDetailPageProps) {
  const { id } = await params;
  const document = await getCoiDocumentById(id);

  if (!document) {
    notFound();
  }

  const isPdf = document.mimeType === "application/pdf";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-1 h-7 px-0 text-xs">
            <Link href="/dashboard">
              <ArrowLeft className="size-3" />
              Back to dashboard
            </Link>
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">
            {document.fileName}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Uploaded {formatDate(document.createdAt)}
          </p>
        </div>
        <StatusBadge
          status={document.status}
          label={COI_STATUS_LABELS[document.status]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="gap-3 py-4">
          <CardHeader className="gap-1 px-4 pb-0">
            <CardTitle className="text-base">Document details</CardTitle>
            <CardDescription className="text-xs">Stored immutably in Cloudinary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4 text-xs">
            <div>
              <p className="text-muted-foreground">File name</p>
              <p className="font-medium">{document.fileName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">MIME type</p>
              <p className="font-medium">{document.mimeType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">File size</p>
              <p className="font-medium">{formatBytes(document.fileSizeBytes)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cloudinary ID</p>
              <p className="break-all font-medium">{document.cloudinaryPublicId}</p>
            </div>
            <Button asChild size="sm" className="w-full">
              <a
                href={document.cloudinaryUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" />
                Open in Cloudinary
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="gap-3 overflow-hidden py-4">
          <CardHeader className="gap-1 px-4 pb-0">
            <CardTitle className="text-base">Document preview</CardTitle>
            <CardDescription className="text-xs">
              {isPdf ? "PDF preview" : "Image preview"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isPdf ? (
              <iframe
                src={document.cloudinaryUrl}
                title={document.fileName}
                className="h-[70vh] w-full rounded-lg border bg-muted"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={document.cloudinaryUrl}
                alt={document.fileName}
                className="max-h-[70vh] w-full rounded-lg border object-contain bg-muted"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

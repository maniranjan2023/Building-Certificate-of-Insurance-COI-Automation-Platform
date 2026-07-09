import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCoiDocumentById } from "@/lib/services/coi";
import { COI_STATUS_LABELS } from "@/lib/services/version-labels";
import { getVersionByDocumentId } from "@/lib/services/version";
import { formatDate } from "@/lib/utils";
import { coiAssetApiPath, coiPdfApiPath } from "@/lib/coi-asset-path";
import { StatusBadge } from "@/components/ui/status-badge";
import { VersionBadge } from "@/components/ui/version-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ComparePageProps {
  searchParams: Promise<{ a?: string; b?: string }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { a, b } = await searchParams;

  if (!a || !b) {
    notFound();
  }

  const [docA, docB, versionA, versionB] = await Promise.all([
    getCoiDocumentById(a),
    getCoiDocumentById(b),
    getVersionByDocumentId(a),
    getVersionByDocumentId(b),
  ]);

  if (!docA || !docB || !versionA || !versionB) {
    notFound();
  }

  if (versionA.senderId !== versionB.senderId) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="size-3" />
            Back to dashboard
          </Link>
        </Button>
        <p className="text-sm text-destructive">
          These documents belong to different tenants and cannot be compared.
        </p>
      </div>
    );
  }

  const isPdfA = docA.mimeType === "application/pdf";
  const isPdfB = docB.mimeType === "application/pdf";

  return (
    <div className="space-y-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-1 h-8 px-0 text-sm">
          <Link href={`/dashboard/${b}`}>
            <ArrowLeft className="size-3" />
            Back to detail
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Compare versions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {versionA.sender.email} — side-by-side review
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[versionA, versionB].map((version, index) => {
          const doc = index === 0 ? docA : docB;
          const isPdf = index === 0 ? isPdfA : isPdfB;

          return (
            <Card key={version.id} className="gap-3 overflow-hidden py-4">
              <CardHeader className="gap-1 px-4 pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <VersionBadge versionNumber={version.versionNumber} />
                  <StatusBadge
                    status={version.status}
                    label={COI_STATUS_LABELS[version.status]}
                  />
                </div>
                <CardTitle className="text-lg">{doc.fileName}</CardTitle>
                <CardDescription className="text-sm">
                  Uploaded {formatDate(version.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {isPdf ? (
                  <iframe
                    src={coiPdfApiPath(doc.id)}
                    title={doc.fileName}
                    className="h-[60vh] w-full rounded-lg border bg-muted"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coiAssetApiPath(doc.id)}
                    alt={doc.fileName}
                    className="max-h-[60vh] w-full rounded-lg border object-contain bg-muted"
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

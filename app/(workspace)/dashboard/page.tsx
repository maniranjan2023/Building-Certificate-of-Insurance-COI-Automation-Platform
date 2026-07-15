import { listCoiDocumentsWithLatestJob } from "@/lib/services/coi";
import { computePortfolioStats } from "@/lib/services/dashboard-stats";
import { CoiUploadForm } from "@/components/coi/coi-upload-form";
import { CoiPortfolio } from "@/components/coi/coi-portfolio";
import { PortfolioHero } from "@/components/dashboard/portfolio-hero";

export default async function DashboardPage() {
  const documents = await listCoiDocumentsWithLatestJob();
  const stats = computePortfolioStats(documents);

  return (
    <div className="space-y-6">
      <PortfolioHero stats={stats} />

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,340px)_1fr]">
        <aside className="xl:sticky xl:top-20 xl:self-start">
          <CoiUploadForm />
        </aside>

        <section className="min-w-0 rounded-2xl border bg-card/60 p-5 shadow-sm backdrop-blur-sm md:p-6">
          <CoiPortfolio documents={documents} />
        </section>
      </div>
    </div>
  );
}

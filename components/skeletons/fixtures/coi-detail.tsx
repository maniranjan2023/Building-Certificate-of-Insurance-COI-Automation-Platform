export function CoiDetailFixture() {
  return (
    <div className="min-w-0 space-y-6">
      <section className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="h-8 w-2/3 max-w-md rounded bg-muted" />
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="h-6 w-24 rounded-full bg-muted/70" />
          <div className="h-6 w-28 rounded-full bg-muted/70" />
        </div>
      </section>
      <div className="grid min-w-0 gap-6 xl:grid-cols-12">
        <div className="min-w-0 space-y-4 xl:col-span-5">
          <section className="overflow-hidden rounded-2xl border bg-card p-4">
            <div className="mb-3 h-5 w-40 rounded bg-muted" />
            <div className="aspect-[3/4] rounded-xl border bg-muted/30" />
          </section>
        </div>
        <div className="min-w-0 space-y-4 xl:col-span-7">
          <section className="rounded-2xl border bg-card p-5">
            <div className="mb-4 h-5 w-48 rounded bg-muted" />
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className="h-16 w-28 shrink-0 rounded-lg border bg-muted/25"
                />
              ))}
            </div>
          </section>
          <section className="rounded-2xl border bg-card p-5">
            <div className="h-5 w-36 rounded bg-muted" />
            <div className="mt-4 h-24 rounded-lg bg-muted/20" />
          </section>
        </div>
      </div>
    </div>
  );
}

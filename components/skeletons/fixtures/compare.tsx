export function CompareVersionsFixture() {
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 h-8 w-56 rounded bg-muted" />
        <div className="h-4 w-72 rounded bg-muted/60" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map((col) => (
          <div key={col} className="overflow-hidden rounded-xl border bg-card py-4">
            <div className="px-4 pb-3">
              <div className="mb-2 flex gap-2">
                <div className="h-6 w-12 rounded-full bg-muted" />
                <div className="h-6 w-20 rounded-full bg-muted/70" />
              </div>
              <div className="h-5 w-40 rounded bg-muted" />
            </div>
            <div className="mx-4 aspect-[3/4] rounded-lg border bg-muted/25" />
          </div>
        ))}
      </div>
    </div>
  );
}

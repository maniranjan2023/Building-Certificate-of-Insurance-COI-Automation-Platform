import { glassSection } from "@/components/marketing/glass-styles";
import { cn } from "@/lib/utils";

const LOGOS = [
  "Oakwood Property",
  "Summit Rentals",
  "Harbor Commercial",
  "Northgate REIT",
  "BlueLine Assets",
];

export function LandingLogos() {
  return (
    <section className={cn("py-10", glassSection)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Trusted by property teams managing compliance at scale
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {LOGOS.map((name) => (
            <span
              key={name}
              className="text-sm font-medium text-muted-foreground/70"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

import { cn } from "@/lib/utils";

/** Frosted glass panel — cards, frames, FAQ items */
export const glassPanel = cn(
  "rounded-2xl border border-white/10 bg-white/[0.06]",
  "shadow-xl shadow-black/20 backdrop-blur-xl",
  "ring-1 ring-inset ring-white/10"
);

/** Interactive glass card with hover lift */
export const glassCard = cn(
  glassPanel,
  "transition-all duration-300",
  "hover:border-white/20 hover:bg-white/[0.09]",
  "hover:shadow-2xl hover:shadow-primary/10"
);

/** Sticky nav / footer bar */
export const glassBar = cn(
  "border-white/10 bg-background/20 backdrop-blur-2xl",
  "supports-[backdrop-filter]:bg-background/10",
  "shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset]"
);

/** Section strip (logos, how-it-works, pricing) */
export const glassSection = cn(
  "border-y border-white/10 bg-white/[0.03] backdrop-blur-md"
);

/** Pill badge / chip */
export const glassBadge = cn(
  "border-white/20 bg-white/10 backdrop-blur-md",
  "shadow-sm ring-1 ring-inset ring-white/10"
);

/** Icon container inside cards */
export const glassIcon = cn(
  "rounded-xl border border-white/15 bg-white/10 backdrop-blur-md",
  "shadow-sm ring-1 ring-inset ring-white/10"
);

/** Stat / metric tile */
export const glassStat = cn(
  glassPanel,
  "bg-linear-to-br from-primary/15 via-white/[0.05] to-transparent"
);

/** Hero screenshot frame */
export const glassFrame = cn(
  glassPanel,
  "overflow-hidden shadow-2xl shadow-primary/15"
);

/** Large CTA band */
export const glassCta = cn(
  glassPanel,
  "rounded-3xl border-primary/25",
  "bg-linear-to-br from-primary/20 via-white/[0.06] to-violet-500/10"
);

/** Outline button on glass surfaces */
export const glassButtonOutline = cn(
  "border-white/20 bg-white/5 backdrop-blur-md",
  "hover:border-white/30 hover:bg-white/10"
);

/** Step / list row */
export const glassRow = cn(
  "rounded-xl border border-white/10 bg-white/[0.05]",
  "backdrop-blur-lg ring-1 ring-inset ring-white/[0.07]",
  "transition-colors hover:border-white/18 hover:bg-white/[0.08]"
);

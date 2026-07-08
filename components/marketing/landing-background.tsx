export function LandingBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.62_0.19_255/0.35),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_0%,oklch(0.72_0.14_280/0.22),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,oklch(0.55_0.12_220/0.18),transparent_50%)]" />
      <div className="absolute -top-40 left-[10%] size-[28rem] rounded-full bg-primary/20 blur-[100px]" />
      <div className="absolute top-[30%] -right-20 size-80 rounded-full bg-violet-500/15 blur-[90px]" />
      <div className="absolute bottom-0 left-1/3 size-96 rounded-full bg-sky-500/10 blur-[100px]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, oklch(1 0 0 / 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(1 0 0 / 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 90% 70% at 50% 0%, black 20%, transparent 75%)",
        }}
      />
    </div>
  );
}

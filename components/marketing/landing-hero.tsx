import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  glassBadge,
  glassButtonOutline,
  glassFrame,
} from "@/components/marketing/glass-styles";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-20 sm:pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,oklch(0.62_0.19_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.62_0.19_255/0.04)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 -right-24 size-72 rounded-full bg-violet-500/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className={cn("mb-6 px-3 py-1 text-primary", glassBadge)}
          >
            <Sparkles className="mr-1.5 size-3.5" />
            Built for property managers & compliance teams
          </Badge>

          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
            Stop reviewing COIs{" "}
            <span className="bg-linear-to-r from-primary via-violet-400 to-sky-400 bg-clip-text text-transparent">
              one PDF at a time
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            COI Platform automates Certificate of Insurance intake, runs a
            five-agent AI compliance review, and sends templated tenant replies —
            so your portfolio stays covered without drowning in email attachments.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-6">
              <Link href="/login">
                Start reviewing COIs
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className={cn("h-11 px-6", glassButtonOutline)}
            >
              <a href="#how-it-works">
                <PlayCircle className="size-4" />
                See how it works
              </a>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Email intake · AI checklist validation · Human-in-the-loop approval
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div
            aria-hidden
            className="absolute -inset-4 rounded-2xl bg-linear-to-b from-primary/20 via-transparent to-transparent blur-2xl"
          />
          <div className={cn("relative", glassFrame)}>
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-md">
              <div className="size-2.5 rounded-full bg-red-400/80" />
              <div className="size-2.5 rounded-full bg-amber-400/80" />
              <div className="size-2.5 rounded-full bg-emerald-400/80" />
              <span className="ml-2 text-xs text-muted-foreground">
                COI Platform — system architecture
              </span>
            </div>
            <Image
              src="/marketing/architecture-diagram.png"
              alt="COI Platform architecture: AgentMail intake, Next.js app, BullMQ worker, AI pipeline, and admin review loop"
              width={1920}
              height={1080}
              className="w-full"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}

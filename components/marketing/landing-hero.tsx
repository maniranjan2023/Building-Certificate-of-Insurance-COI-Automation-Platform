"use client";

import Link from "next/link";
import { ArrowRight, Building2, CalendarClock, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  glassBadge,
  glassButtonOutline,
  glassFrame,
  glassStat,
} from "@/components/marketing/glass-styles";
import { cn } from "@/lib/utils";

const PREVIEW_STATS = [
  { label: "Compliant", value: "142", sub: "tenants current", tone: "text-emerald-400" },
  { label: "Needs review", value: "8", sub: "awaiting decision", tone: "text-amber-400" },
  { label: "Expiring soon", value: "5", sub: "renewal reminders sent", tone: "text-sky-400" },
];

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

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-4xl text-center"
        >
          <Badge variant="outline" className={cn("mb-6 px-3 py-1 text-primary", glassBadge)}>
            <Sparkles className="mr-1.5 size-3.5" />
            COI compliance for growing portfolios
          </Badge>

          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-[3.4rem] lg:leading-[1.1]">
            Stop gambling on{" "}
            <span className="bg-linear-to-r from-primary via-violet-400 to-sky-400 bg-clip-text text-transparent">
              tenant insurance proof
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Landlords and property managers are legally on the hook for every tenant&apos;s
            coverage — but most teams still review COIs manually, one PDF at a time. COI Platform
            gives you portfolio-wide visibility, consistent validation, and clear tenant
            communication.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-6">
              <Link href="/login">
                See your compliance dashboard
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className={cn("h-11 px-6", glassButtonOutline)}
            >
              <a href="#problem">Why teams switch</a>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Built for property managers, asset operators, and compliance teams
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-16 max-w-4xl"
        >
          <div
            aria-hidden
            className="absolute -inset-4 rounded-2xl bg-linear-to-b from-primary/20 via-transparent to-transparent blur-2xl"
          />
          <div className={cn("relative", glassFrame)}>
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-red-400/80" />
                <div className="size-2.5 rounded-full bg-amber-400/80" />
                <div className="size-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <span className="text-xs text-muted-foreground">Portfolio compliance overview</span>
              <Building2 className="size-4 text-primary/80" />
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
              {PREVIEW_STATS.map((stat) => (
                <Card
                  key={stat.label}
                  className={cn("border-0 bg-transparent shadow-none", glassStat)}
                >
                  <CardContent className="p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className={cn("mt-2 text-4xl font-semibold tabular-nums", stat.tone)}>
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  Limits & endorsements checked
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="size-3.5 text-sky-400" />
                  Renewals tracked automatically
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  Every decision logged
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

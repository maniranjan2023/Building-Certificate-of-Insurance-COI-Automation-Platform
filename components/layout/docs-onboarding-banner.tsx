"use client";

import { useEffect, useState } from "react";
import { BookOpen, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const DOCS_BANNER_DISMISSED_KEY = "coi-docs-banner-dismissed";

/**
 * Clears dismiss state so the guide banner shows again after a fresh login.
 */
export function resetDocsBannerForLogin(): void {
  try {
    window.localStorage.removeItem(DOCS_BANNER_DISMISSED_KEY);
    window.sessionStorage.setItem("coi-docs-banner-force", "1");
  } catch {
    // Ignore storage failures (private mode, etc.)
  }
}

/**
 * Help banner under the header after admin login.
 * Stays until dismissed with X. Opens the full guide in a new tab.
 */
export function DocsOnboardingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const forceShow =
        window.sessionStorage.getItem("coi-docs-banner-force") === "1";
      const dismissed =
        window.localStorage.getItem(DOCS_BANNER_DISMISSED_KEY) === "1";

      if (forceShow) {
        window.sessionStorage.removeItem("coi-docs-banner-force");
        window.localStorage.removeItem(DOCS_BANNER_DISMISSED_KEY);
        setVisible(true);
        return;
      }

      setVisible(!dismissed);
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(DOCS_BANNER_DISMISSED_KEY, "1");
      window.sessionStorage.removeItem("coi-docs-banner-force");
    } catch {
      // Ignore storage failures
    }
    setVisible(false);
  }

  function openDocs() {
    window.open("/docs", "_blank", "noopener,noreferrer");
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="How to use guide"
      className="border-b border-blue-600/20 bg-blue-600/[0.07]"
    >
      <div className="flex items-start gap-3 px-4 py-2.5 md:items-center md:px-6">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white md:mt-0">
          <BookOpen className="size-4" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            How to use this platform
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
            Email steps (where to send, subject, body, attachment) and how to
            upload. Also in the sidebar under How to use this platform.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            className="h-8 bg-blue-600 text-white hover:bg-blue-700"
            onClick={openDocs}
          >
            Open guide
            <ExternalLink className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={dismiss}
            aria-label="Dismiss guide banner"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetDocsBannerForLogin } from "@/components/layout/docs-onboarding-banner";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Invalid credentials");
      }

      // Show the how-to banner on the next workspace load until the admin dismisses it.
      resetDocsBannerForLogin();
      window.location.assign("/dashboard");
      return;
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Login failed"
      );
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-sm border-border/60 shadow-lg">
      <CardHeader className="gap-2 space-y-2 p-4 text-center">
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Shield className="size-4" />
        </div>
        <div>
          <CardTitle className="text-lg">Admin sign in</CardTitle>
          <CardDescription className="text-sm">
            COI Compliance Automation Platform
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <form
          onSubmit={handleSubmit}
          className="space-y-3"
          aria-busy={isSubmitting || undefined}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              className="h-9 text-sm"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              className="h-9 text-sm"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={isSubmitting}
            aria-busy={isSubmitting || undefined}
            aria-label={isSubmitting ? "Signing in" : "Sign in"}
          >
            {isSubmitting ? <Spinner className="size-4" /> : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

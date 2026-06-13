"use client";

import { ContinueAsGuestButton } from "@/components/auth/continue-as-guest-button";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { AlertCircle, LogIn, UserPlus } from "lucide-react";

export default function SessionRecovery({
  title = "Your session is no longer active",
  description = "Guest sessions can expire or be cleared by your browser. Sign in to keep your data long term, or start a fresh guest planner.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <main className="mx-4 flex min-h-[calc(100vh-8.75rem)] items-center justify-center py-16">
      <section className="w-full max-w-xl rounded-lg border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <SignInButton mode="modal" forceRedirectUrl="/planner">
            <Button className="gap-2">
              <LogIn className="h-4 w-4" />
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal" forceRedirectUrl="/account/setup">
            <Button variant="outline" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Create account
            </Button>
          </SignUpButton>
          <ContinueAsGuestButton size="default" variant="secondary" />
        </div>
      </section>
    </main>
  );
}

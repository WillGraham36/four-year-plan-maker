"use client";

import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { LockKeyhole, ShieldCheck, UserPlus } from "lucide-react";

export default function GuestAuditLock() {
  return (
    <main className="mx-4 flex min-h-[calc(100vh-8.75rem)] items-center justify-center py-16">
      <section className="w-full max-w-2xl rounded-lg border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
            <LockKeyhole className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Account required
            </div>
            <h1 className="mt-4 text-2xl font-semibold">Sign in to unlock Degree Audit</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Guests can build and download a graduation plan, but audit checks require an account so your academic data can stay attached to you across devices.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <SignInButton mode="modal" forceRedirectUrl="/audit">
                <Button className="gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Sign in to unlock
                </Button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/audit">
                <Button variant="outline" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create account
                </Button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

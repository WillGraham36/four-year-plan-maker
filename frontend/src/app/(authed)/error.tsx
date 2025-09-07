"use client";

import PageError from "@/components/layout/page-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageError error={error.message} />
  );
}

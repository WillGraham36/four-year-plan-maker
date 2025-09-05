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
    <html>
      <body className="p-6">
        <PageError error={error.message} />
      </body>
    </html>
  );
}

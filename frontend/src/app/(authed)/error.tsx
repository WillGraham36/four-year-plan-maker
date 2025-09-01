"use client";

import { Button } from "@/components/ui/button";

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
        <h2 className="text-xl font-semibold">Something went wrong!</h2>
        <p className="text-gray-500">{error.message}</p>
        <Button
          onClick={() => reset()}
        >
          Try again
        </Button>
      </body>
    </html>
  );
}

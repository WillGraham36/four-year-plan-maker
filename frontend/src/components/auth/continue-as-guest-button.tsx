"use client";

import { Button } from "@/components/ui/button";
import { startDelayedLoadingToast } from "@/lib/delayed-loading-toast";
import { CurrentUserSession } from "@/lib/utils/types";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ComponentProps } from "react";
import { useState } from "react";
import { toast } from "sonner";

type ContinueAsGuestButtonProps = {
  className?: string;
  label?: string;
  redirectTo?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
};

export function ContinueAsGuestButton({
  className,
  label = "Try without signing in",
  redirectTo = "/account/setup",
  variant = "secondary",
  size = "lg",
}: ContinueAsGuestButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    const dismissLoadingToast = startDelayedLoadingToast();
    try {
      const response = await fetch("/api/auth/guest", {
        method: "POST",
        credentials: "include",
        cache: "no-cache",
      });
      const body = await response.json();

      if (!response.ok || !body.data) {
        toast.error(body.message || "Could not start a guest session");
        return;
      }

      const session = body.data as CurrentUserSession;
      router.push(session.pending ? redirectTo : "/planner");
      router.refresh();
    } catch (error) {
      console.error("Guest session creation failed", error);
      toast.error("Could not start a guest session");
    } finally {
      dismissLoadingToast();
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      disabled={loading}
      onClick={handleClick}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
      <span>{loading ? "Starting..." : label}</span>
    </Button>
  );
}

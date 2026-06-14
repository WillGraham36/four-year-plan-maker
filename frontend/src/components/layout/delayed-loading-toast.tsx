"use client";

import { startDelayedLoadingToast } from "@/lib/delayed-loading-toast";
import { useEffect } from "react";

export function DelayedLoadingToast() {
  useEffect(() => startDelayedLoadingToast(), []);

  return null;
}

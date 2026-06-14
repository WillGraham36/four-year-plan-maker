import { toast } from "sonner";

export const DELAYED_LOADING_TOAST_MESSAGE =
  "Hang on while we get things ready for you";
export const DELAYED_LOADING_TOAST_DELAY_MS = 3000;

type DelayedLoadingToastOptions = {
  message?: string;
  delayMs?: number;
};

export function startDelayedLoadingToast({
  message = DELAYED_LOADING_TOAST_MESSAGE,
  delayMs = DELAYED_LOADING_TOAST_DELAY_MS,
}: DelayedLoadingToastOptions = {}) {
  let toastId: string | number | undefined;
  let dismissed = false;

  const timeoutId = window.setTimeout(() => {
    if (dismissed) {
      return;
    }

    toastId = toast.loading(message, {
      duration: Infinity,
    });
  }, delayMs);

  return () => {
    dismissed = true;
    window.clearTimeout(timeoutId);

    if (toastId !== undefined) {
      toast.dismiss(toastId);
    }
  };
}

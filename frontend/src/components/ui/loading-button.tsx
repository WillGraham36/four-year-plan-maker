import * as React from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import { LoaderCircleIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ children, loading = false, disabled, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={loading || disabled}
        className={cn("relative disabled:opacity-100", className)}
        {...props}
      >
        <span className={loading ? "text-transparent" : ""}>
          {children}
        </span>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoaderCircleIcon
              className="animate-spin"
              size={16}
              aria-hidden="true"
            />
          </div>
        )}
      </Button>
    )
  }
)

LoadingButton.displayName = "LoadingButton"

export default LoadingButton 
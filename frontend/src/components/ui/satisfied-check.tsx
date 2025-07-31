'use client'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Circle, CircleCheckBig } from "lucide-react"

interface SatisfiedCheckProps {
  isSatisfied: boolean;
  message: string;
}

const SatisfiedCheck = ({
  isSatisfied,
  message,
}: SatisfiedCheckProps) => {
  return (
    <Tooltip delayDuration={1000}>
      <TooltipTrigger className='text-secondary flex items-center gap-1 cursor-default' asChild>
        <span>
          {isSatisfied ? (
            <CircleCheckBig size={16} className='inline text-green-500' />
          ) : (
            <Circle size={16} className='inline' />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent className='text-center'>
        {isSatisfied ? "Requirement satisfied" : message}
      </TooltipContent>
    </Tooltip>
  )
}

export default SatisfiedCheck
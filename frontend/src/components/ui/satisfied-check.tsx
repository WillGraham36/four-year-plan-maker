'use client'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Circle, CircleCheckBig } from "lucide-react"

type SatisfiedCheckProps =
  | {
      isChecked: boolean;
      canCheck: true;
      onCheck: () => void;
      message: string;
    }
  | {
      isChecked: boolean;
      canCheck?: false | undefined;
      onCheck?: undefined;
      message: string;
    };

const SatisfiedCheck = ({
  isChecked,
  canCheck = false,
  onCheck,
  message,
}: SatisfiedCheckProps) => {
  return (
    <Tooltip delayDuration={1000}>
      <TooltipTrigger 
        className={`text-secondary flex items-center gap-1 z-40 ${canCheck ? 'cursor-pointer' : 'cursor-default'}`} 
        asChild
        onClick={canCheck ? onCheck : undefined}
      >
        <span>
          {isChecked ? (
            <CircleCheckBig size={16} className='inline text-green-500' />
          ) : (
            <Circle size={16} className='inline' />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent className='text-center'>
        {isChecked ? "Requirement satisfied" : message}
      </TooltipContent>
    </Tooltip>
  )
}

export default SatisfiedCheck
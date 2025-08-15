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
      uncheckedMessage: string;
      checkedMessage: string;
    }
  | {
      isChecked: boolean;
      canCheck?: false | undefined;
      onCheck?: undefined;
      uncheckedMessage: string;
      checkedMessage: string;
    };

const SatisfiedCheck = ({
  isChecked,
  canCheck = false,
  onCheck,
  uncheckedMessage,
  checkedMessage, 
}: SatisfiedCheckProps) => {
  return (
    <Tooltip delayDuration={1000}>
      <TooltipTrigger 
        className={`text-secondary flex items-center gap-1 z-40 rounded-full ${canCheck ? 'cursor-pointer' : 'cursor-default'}`} 
        asChild={!canCheck}
        onClick={canCheck ? onCheck : undefined}
      >
        <span className="flex items-center">
          {isChecked ? (
            <CircleCheckBig size={16} className='text-green-500' />
          ) : (
            <Circle size={16} />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent className='text-center'>
        {isChecked ? checkedMessage : uncheckedMessage}
      </TooltipContent>
    </Tooltip>
  )
}

export default SatisfiedCheck
import React from 'react'
import { Button } from '../ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { GenEd } from '@/lib/utils/types';

interface SelectGenEdButtonProps {
  children: React.ReactNode;
  genEds: GenEd[];
  onSelect:  React.Dispatch<React.SetStateAction<GenEd[]>>;
  selected?: boolean;
  isFirstInGroup?: boolean;
}

const SelectGenEdButton = ({
  children,
  genEds,
  onSelect,
  selected = false,
  isFirstInGroup = false,
}: SelectGenEdButtonProps) => {
  const selectButton = (
    <Button
      tabIndex={-1}
      variant={"blank"} 
      className={`!py-0.5 !px-2 !h-auto font-normal 
        ${selected ? "bg-accent" : ""} 
        ${isFirstInGroup ? "-ml-2": ""}`
      }
      onClick={() => onSelect(genEds)}
    >
      {children}
    </Button>
  )
  if(selected) {
    return (
      <Tooltip delayDuration={1000}>
        <TooltipTrigger className='cursor-pointer' asChild tabIndex={-1}>
          {selectButton}
        </TooltipTrigger>
        <TooltipContent className='text-center'>
          Select which GenEd this course should fulfill
        </TooltipContent>
      </Tooltip>
    )
  } else {
    return selectButton;
  };
}

export default SelectGenEdButton
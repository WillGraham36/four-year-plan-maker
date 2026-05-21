import React from "react";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SelectGenEdHighlightProps {
  children: React.ReactNode;
  selected?: boolean;
  isFirstInGroup?: boolean;
}

const SelectGenEdHighlight = ({
  children,
  selected = false,
  isFirstInGroup = false,
}: SelectGenEdHighlightProps) => {
  const selectButton = (
    <div
      tabIndex={-1}
      className={`py-0.5! px-2! h-auto! font-normal cursor-default rounded-md
        ${selected ? "bg-accent hover:bg-accent/50 transition-colors" : ""} 
        ${isFirstInGroup ? "-ml-2" : ""}`}
    >
      {children}
    </div>
  );
  if (selected) {
    return (
      <Tooltip delayDuration={750}>
        <TooltipTrigger asChild tabIndex={-1}>
          {selectButton}
        </TooltipTrigger>
        <TooltipContent className="text-center">
          Automatically assigned based on your full plan
        </TooltipContent>
      </Tooltip>
    );
  } else {
    return selectButton;
  }
};

export default SelectGenEdHighlight;

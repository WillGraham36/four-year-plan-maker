'use client';
import React, { useEffect, useState } from "react";
import { AccordionContent, AccordionTrigger } from "./accordion";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface DefaultOpenAccordionProps {
  accordion: React.ReactElement<{ children: React.ReactElement }>;
  content: React.ReactNode;
  contentClassName?: string;
  trigger: React.ReactNode;
  triggerClassName?: string;
  itemClassName?: string;
}

const DefaultOpenAccordion = ({ content, trigger, accordion, contentClassName, triggerClassName, itemClassName }: DefaultOpenAccordionProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if(!isLoaded) {
    return (
      <div data-state="open" className={itemClassName}>
        <div 
          className={cn(
            "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=closed]>svg]:rotate-180",
            triggerClassName
          )}>
          {trigger}
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 rotate-180" />
        </div>
        <div className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className={cn("pb-4 pt-0", contentClassName)}>
            {content}
          </div>
        </div>
      </div>
    )
  }

  const accordionWithContent = React.cloneElement(accordion, {}, 
    React.cloneElement((accordion.props as { children: React.ReactElement }).children, {}, 
      <>
        <AccordionTrigger className={triggerClassName}>
          {trigger}
        </AccordionTrigger>
        <AccordionContent className={contentClassName}>
          {content}
        </AccordionContent>
      </>
    )
  );

  return accordionWithContent;
}

export default DefaultOpenAccordion
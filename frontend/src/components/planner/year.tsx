import React, { ReactNode } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import UseYearAccordian from '@/lib/hooks/use-year-accordion';
import DefaultOpenAccordion from '../ui/default-open-accordion';

const Year = ({ year, children }: {  year: number, children: ReactNode }) => {
  const { isYearOpen, toggleYear, isLoaded } = UseYearAccordian();
  const shouldBeOpen = isYearOpen(year);
  const handleValueChange = (value: string | undefined) => {
    const isOpening = value === `year-${year}`
    toggleYear(year, isOpening)
  }

  return (
    <DefaultOpenAccordion
    itemClassName='border-b-1'
      triggerClassName='py-2'
      trigger={
        <>
          Year {year}
        </>
      }
      contentClassName='flex flex-col md:grid md:grid-cols-2 gap-3 pb-2 pt-1'
      content={
        <>
          {children}
        </>
      }
      accordion={
        <Accordion
          type="single" 
          collapsible 
          defaultValue={`year-${year}`}
          value={shouldBeOpen ? `year-${year}` : ""}
          onValueChange={handleValueChange}
        >
          <AccordionItem value={`year-${year}`} >
          </AccordionItem>
        </Accordion>
      }
    />
  )
}

export default Year
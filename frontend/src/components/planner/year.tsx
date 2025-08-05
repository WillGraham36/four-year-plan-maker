import React, { ReactNode } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import UseYearAccordian from '@/lib/hooks/use-year-accordion';

const Year = ({ year, children }: {  year: number, children: ReactNode }) => {
  const { isYearOpen, toggleYear, isLoaded } = UseYearAccordian();
  const shouldBeOpen = isYearOpen(year);
  const handleValueChange = (value: string | undefined) => {
    const isOpening = value === `year-${year}`
    toggleYear(year, isOpening)
  }

  return (
    <Accordion 
      type="single" 
      collapsible 
      defaultValue={`year-${year}`}
      value={shouldBeOpen ? `year-${year}` : ""}
      onValueChange={handleValueChange}
    >
      <AccordionItem value={`year-${year}`} >
        <AccordionTrigger className='py-2'>Year {year}</AccordionTrigger>
        <AccordionContent className='flex flex-col md:grid md:grid-cols-2 gap-3 pb-2 pt-1'>
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default Year
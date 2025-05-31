import React, { ReactNode } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const Year = ({ year, children }: {  year: number, children: ReactNode }) => {
  return (
    <Accordion type="single" collapsible defaultValue={`year-${year}`}>
      <AccordionItem value={`year-${year}`} >
        <AccordionTrigger className='py-2'>Year {year}</AccordionTrigger>
        <AccordionContent className='flex flex-col md:flex-row gap-3 pb-2 pt-1'>
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default Year
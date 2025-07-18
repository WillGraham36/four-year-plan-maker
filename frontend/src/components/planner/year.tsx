import React, { ReactNode } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const Year = ({ year, children }: {  year: number, children: ReactNode }) => {
  const childrenArray = React.Children.toArray(children);
  const hasOnlySpring = childrenArray.length === 1 && 
    React.isValidElement(childrenArray[0]) && 
    (childrenArray[0].props as any).term === 'SPRING';

    
  return (
    <Accordion type="single" collapsible defaultValue={`year-${year}`}>
      <AccordionItem value={`year-${year}`} >
        <AccordionTrigger className='py-2'>Year {year}</AccordionTrigger>
        <AccordionContent className='grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 pt-1'>
          {hasOnlySpring ? (
            <div className={hasOnlySpring ? 'md:col-start-2' : ''}>
              {children}
            </div>
          ) : (
            <>
              {children}
            </>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default Year
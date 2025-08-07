import React, { createContext, useContext, ReactNode } from 'react'
import UseYearAccordion from "../hooks/use-year-accordion"

interface AccordionContextType {
  isYearOpen: (year: number) => boolean
  toggleYear: (year: number, isOpen: boolean) => void
  isLoaded: boolean
}

const AccordionContext = createContext<AccordionContextType | undefined>(undefined)

export const AccordionProvider = ({ children }: { children: ReactNode }) => {
  const accordionState = UseYearAccordion()

  return (
    <AccordionContext.Provider value={accordionState}>
      {children}
    </AccordionContext.Provider>
  )
}

export const useAccordionContext = () => {
  const context = useContext(AccordionContext)
  if (context === undefined) {
    throw new Error('useAccordionContext must be used within an AccordionProvider')
  }
  return context
}
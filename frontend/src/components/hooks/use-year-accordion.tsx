import { useState, useEffect } from 'react'

const UseYearAccordion = () => {
  const [closedYears, setClosedYears] = useState<Set<number>>(new Set())
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load saved state from localStorage
    const saved = localStorage.getItem('closed-years')
    if (saved) {
      try {
        const savedClosedYears = JSON.parse(saved)
        setClosedYears(new Set(savedClosedYears))
      } catch (error) {
        console.error('Failed to parse saved accordion state:', error)
      }
    } else {
      setClosedYears(new Set())
      localStorage.setItem('closed-years', JSON.stringify([]))
    }
    setIsLoaded(true)
  }, [])

  // Separate effect to sync closedYears to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('closed-years', JSON.stringify([...closedYears]))
    }
  }, [closedYears, isLoaded])

  const toggleYear = (year: number, isOpen: boolean) => {
    const currentlyOpen = !closedYears.has(year)
    
    // Don't do anything if state isn't actually changing
    if (currentlyOpen === isOpen) return
    
    setClosedYears(prev => {
      const newClosedYears = new Set(prev)
      console.log('Before toggle:', newClosedYears)
      if (isOpen) {
        newClosedYears.delete(year)
      } else {
        newClosedYears.add(year)
      }
      console.log('after toggle:', newClosedYears)
      return newClosedYears
    })
  }

  const isYearOpen = (year: number) => {
    // Default to open until localStorage is loaded
    if (!isLoaded) return true
    
    // Year is open if it's NOT in the closed years set
    return !closedYears.has(year)
  }

  return { isYearOpen, toggleYear, isLoaded }  
}

export default UseYearAccordion
import { useState, useEffect } from 'react'

const UseYearAccordian = () => {
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
    }
    setIsLoaded(true)
  }, [])

  const toggleYear = (year: number, isOpen: boolean) => {
    setClosedYears(prev => {
      const newClosedYears = new Set(prev)
      if (isOpen) {
        newClosedYears.delete(year)
      } else {
        newClosedYears.add(year)
      }
      
      localStorage.setItem('closed-years', JSON.stringify([...newClosedYears]))
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

export default UseYearAccordian;
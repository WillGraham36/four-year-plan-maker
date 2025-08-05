import { useState, useEffect } from 'react'

const UseYearAccordian = () => {
  const [openYears, setOpenYears] = useState<Set<number>>(new Set())
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load saved state from localStorage
    const saved = localStorage.getItem('open-years')
    if (saved) {
      try {
        const savedYears = JSON.parse(saved)
        setOpenYears(new Set(savedYears))
      } catch (error) {
        console.error('Failed to parse saved accordion state:', error)
      }
    }
    setIsLoaded(true)
  }, [])

  const toggleYear = (year: number, isOpen: boolean) => {
    setOpenYears(prev => {
      const newOpenYears = new Set(prev)
      if (isOpen) {
        newOpenYears.add(year)
      } else {
        newOpenYears.delete(year)
      }
      
      // Save to localStorage
      localStorage.setItem('open-years', JSON.stringify([...newOpenYears]))
      return newOpenYears
    })
  }

  const isYearOpen = (year: number) => {
    // Default to open until localStorage is loaded
    if (!isLoaded) return true
    return openYears.has(year)
  }

  return { isYearOpen, toggleYear, isLoaded }  
}

export default UseYearAccordian;
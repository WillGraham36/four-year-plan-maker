import { ThemeProvider } from '@/components/context/theme-provider'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

const NotFoundPage = () => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      key="four-year-planner-theme"
      storageKey="four-year-planner-theme"
      enableSystem
      disableTransitionOnChange
    >
      <main className='flex flex-col items-center justify-center h-screen'>
        <h1 className='text-4xl font-bold'>404 - Not Found</h1>
        <p className='mt-4'>Sorry, the page you are looking for does not exist.</p>
        <div>
          <Link href={"/"}>
            <Button className='mt-6 w-52'>Go to Home</Button>
          </Link>
        </div>
      </main>
    </ThemeProvider>
  )
}

export default NotFoundPage
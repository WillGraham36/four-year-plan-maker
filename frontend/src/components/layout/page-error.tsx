'use client'
import React from 'react'
import { Button } from '../ui/button'

const PageError = ({ error}: { error: string; }) => {
  return (
    <div className='w-full h-[calc(100vh-8.75rem)] flex flex-col items-center justify-center gap-4'>
      <h2 className="text-2xl font-semibold">Something went wrong!</h2>
      <p className="text-gray-500">{error}</p>
      <Button
        className='w-52'
        onClick={() => {window.location.reload()}}
      >
        Try again
      </Button>
    </div>
  )
}

export default PageError
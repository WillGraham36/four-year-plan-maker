'use client';
import dynamic from 'next/dynamic'
import React from 'react'
import { SemesterHeaderText } from './semester'

const NotesEditor = dynamic(() => import('./notes-editor'), {
  ssr: false,
  loading: () => <div className="h-44 w-full animate-pulse bg-muted/40" />,
});

const Notes = ({ note }: { note: string | null | undefined}) => {
  return (
    <div className="flex flex-col rounded-lg border w-full h-min bg-card shadow-md">
      <SemesterHeaderText>
        Notes
      </SemesterHeaderText>
      <NotesEditor note={note} />
    </div>
  )
}

export default Notes

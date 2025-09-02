'use client';
import React from 'react'
import { SemesterHeaderText } from './semester'
import { Textarea } from '../ui/textarea'
import { useDebounce } from 'use-debounce';
import { toast } from 'sonner';
import { useCourseApi } from '@/lib/api/planner/planner.client';

const Notes = ({ note }: { note: string | null | undefined}) => {
  const [noteText, setNoteText] = React.useState(note || '');
  const [debouncedNoteText] = useDebounce(noteText, 500);
  const { updateUserNote } = useCourseApi();

  // Effect to handle the debounced server request
  React.useEffect(() => {
    if (debouncedNoteText === (note || '')) return;
    
    const updateNote = async () => {
      const res = await updateUserNote(debouncedNoteText);
      if (!res.ok) {
        toast.error("Failed to update note");
      }
    };

    updateNote();
  }, [debouncedNoteText, note]);

  return (
    <div className="flex flex-col rounded-lg border w-full h-min bg-card shadow-md">
      <SemesterHeaderText>
        Notes
      </SemesterHeaderText>
      <Textarea 
        className='rounded-t-none border-0 focus-visible:ring-0 max-h-56' 
        placeholder='Add any notes about the courses you want to take here...' 
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)} 
      />
    </div>
  )
}

export default Notes
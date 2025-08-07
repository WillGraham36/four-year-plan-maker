'use client';
import SatisfiedCheck from '../ui/satisfied-check';
import { X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "../ui/button";
import { DialogClose } from "@radix-ui/react-dialog";
import RemoveCourseButton from "./remove-course-button";
import { Term } from '@/lib/utils/types';
import { termYearToString } from '@/lib/utils';
import { useState } from 'react';
import { useRequirements } from '../context/requirements-context';
import { updateSemesterCompletion } from '@/lib/api/planner/planner.server';
import { toast } from 'sonner';

interface SemesterHeaderProps {
  term: Term;
  year: number;
  removable?: boolean;
  completed: boolean;
  setCompleted: (completed: boolean) => void;
}
const SemesterHeader = ({ term, year, removable, completed, setCompleted }: SemesterHeaderProps) => {
  const { updateCompletedSemesters } = useRequirements();
  const semesterTerm = termYearToString(term, year);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleCompletion = async () => {
    if (isUpdating) return; // Prevent double-clicks
    
    const previousState = completed;
    const newState = !completed;
    
    setCompleted(newState);
    updateCompletedSemesters({ term, year });
    setIsUpdating(true);
    
    try {
      const res = await updateSemesterCompletion(term, year, newState);
      if (!res.ok) throw new Error('Update failed');
    } catch (error) {
      toast.error("Error updating semester completion, please try again");
      setCompleted(previousState);
      updateCompletedSemesters({ term, year });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between w-full border-b px-3 p-1">
      <p className="text-sm md:text-base">
        {semesterTerm}
      </p>
      <div className='flex items-center gap-2'>
        <span className='flex items-center gap-1'>
          <p className="text-xs text-muted-foreground">
            Completed:
          </p>
          <SatisfiedCheck
            isChecked={completed}
            canCheck={true}
            onCheck={toggleCompletion}
            message={completed ? "Click to mark as incomplete" : "Click to mark as complete"}
          />
        </span>
        {removable && (
          <Dialog>
            <DialogTrigger className='z-40'>
              <Tooltip delayDuration={750}>
                <TooltipTrigger 
                className="rounded-full w-4 h-4 flex items-center justify-center bg-secondary hover:bg-red-600 opacity-80 p-0.5 hover:text-white transition-all duration-200"
                asChild
                >
                  <X className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent className="text-sm text-muted-foreground p-1 px-2">
                  Remove semester
                </TooltipContent>
              </Tooltip>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure you want to remove this semester?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. All courses in this semester will be deleted
                </DialogDescription>
                <div className="flex items-center justify-end gap-2">
                    <DialogClose asChild>
                      <Button
                        size={"sm"}
                        variant={"outline"}
                        className="mt-4 py-1"
                      >
                        Cancel
                      </Button>
                    </DialogClose>

                    <DialogClose asChild>
                      <RemoveCourseButton term={term} year={year} />
                    </DialogClose>
                  </div>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

export default SemesterHeader
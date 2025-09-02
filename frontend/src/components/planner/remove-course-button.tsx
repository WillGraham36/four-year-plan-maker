'use client'
import React from 'react'
import { Button } from '../ui/button'
import { useRequirements } from '../context/requirements-context';
import { Term } from '@/lib/utils/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import LoadingButton from '../ui/loading-button';
import { useSemester } from '../context/semester-context';
import { useCourseApi } from '@/lib/api/planner/planner.client';

const RemoveCourseButton = ({ term, year }: { term: Term, year: number }) => {
  const [loading, setLoading] = React.useState(false);
  const { refreshAllRequirements, updateTotalCredits, updateCompletedSemesters } = useRequirements();
  const { getTotalCredits } = useSemester();
  const { deleteOffTerm } = useCourseApi();
  const router = useRouter();

  const onRemoveSemester = async () => {
    setLoading(true);
    const res = await deleteOffTerm(term, year);
    if (!res.ok) {
      toast.error("Failed to remove semester. Please try again");
      setLoading(false);
      return;
    }
    const numCreditsRemoved = getTotalCredits();
    await Promise.all([
      refreshAllRequirements(),
      updateTotalCredits(numCreditsRemoved, true),
    ]);
    updateCompletedSemesters({ term, year }, true);
    router.refresh();
    setLoading(false);
  }

  return (
    <LoadingButton
      size={"sm"}
      variant="destructive"
      className="mt-4"
      onClick={onRemoveSemester}
      loading={loading}
    >
      Remove Semester
    </LoadingButton>
  )
}

export default RemoveCourseButton
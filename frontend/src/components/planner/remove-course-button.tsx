'use client'
import React from 'react'
import { Button } from '../ui/button'
import { useRequirements } from './requirements-context';
import { deleteOffTerm } from '@/lib/api/planner/planner.server';
import { Term } from '@/lib/utils/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSemester } from './semester-context';
import { LoaderCircleIcon } from 'lucide-react';
import LoadingButton from '../ui/loading-button';

const RemoveCourseButton = ({ term, year }: { term: Term, year: number }) => {
  const [loading, setLoading] = React.useState(false);
  const { refreshAllRequirements, updateTotalCredits } = useRequirements();
  const { getTotalCredits } = useSemester();
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
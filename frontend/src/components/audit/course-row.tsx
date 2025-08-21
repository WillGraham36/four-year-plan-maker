
import { cn } from '@/lib/utils';
import React, { ReactNode } from 'react';

const getSharedClasses = (isLast: boolean, completed: boolean, planned: boolean, headerRow: boolean) => 
  `px-3 py-1 text-sm md:text-sm text-muted-foreground bg-background transition-all duration-200 flex items-center ${
    !isLast ? 'border-b' : ''
  } ${
    completed ? 'bg-completed/35 dark:bg-green-800/15' : ''
  } ${
    planned ? 'bg-planned/35 dark:bg-yellow-800/15' : ''
  } ${headerRow ? 'bg-card' : ''}`;

interface CourseRowProps {
  columns: (string | ReactNode)[];
  isLast?: boolean;
  completed?: boolean;
  planned?: boolean;
  headerRow?: boolean;
  className?: string;
}

const CourseRow = ({ 
  columns, 
  isLast = false, 
  completed = false, 
  planned = false,
  headerRow = false,
  className = ""
}: CourseRowProps) => {
  return (
    <>
      {columns.map((column, index) => (
        <div
          key={index}
          className={cn(
            getSharedClasses(isLast, completed, planned, headerRow),
            index > 0 ? "border-l" : "",
            "break-words",
            columns.length === 1 ? "col-span-2" : "",
            className
          )}
        >
          {typeof column === "string" && column.includes("|") ? (
            <>
              <span className="w-20 inline-block">{column.split("|")[0]}</span>
              <span className="pr-2">|</span>
              {column.slice(column.indexOf("|") + 1)}
            </>
          ) : typeof column === "string" ? (
            <span className="font-normal">{column}</span>
          ) : (
            column
          )}
        </div>
      ))}
    </>
  );
};

export default CourseRow;
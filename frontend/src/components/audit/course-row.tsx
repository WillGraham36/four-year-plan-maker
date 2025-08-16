import React from 'react'

const getSharedClasses = (isLast: boolean, completed: boolean, headerRow: boolean) => 
  `px-3 py-1 text-sm md:text-sm text-muted-foreground bg-background transition-all duration-200 ${!isLast ? 'border-b' : ''} ${completed ? 'bg-green-500/15 dark:bg-green-800/15' : ''} ${headerRow ? ' bg-card' : ''}`;

interface CourseRowProps {
  firstCol: string
  secondCol: string
  isLast?: boolean
  completed?: boolean
  headerRow?: boolean
}

const CourseRow = ({ firstCol, secondCol, isLast = false, completed = false, headerRow = false }: CourseRowProps) => {
  return (
    <React.Fragment>
      <p className={`${getSharedClasses(isLast, completed, headerRow)} ${secondCol === "" ? "col-span-2" : ""}`}>
        {firstCol}
      </p>
      {secondCol !== "" && (
        <p className={`${getSharedClasses(isLast, completed, headerRow)} ${secondCol === "" ? "" : "border-l"} break-all`}>
          {secondCol?.includes("|") ? (
            <>
              <span className="w-20 inline-block">{secondCol.split("|")[0]}</span>
              <span className='pr-2'>|</span>
              {secondCol.slice(secondCol.indexOf("|") + 1)}
            </>
          ) : (
            <span className="font-normal">{secondCol}</span>
          )}
        </p>
      )}
    </React.Fragment>
  )
}

export default CourseRow
import React from 'react'

const GenEds = [
  'FSAW',
  'FSPW',
  'FSMA',
  'FSOC',
  'FSAR',

  'DSNL',
  'DSNS or NL',
  'DSHS',
  'DSHS',
  'DSHU',
  'DSHU',
  'DSSP',
  'DSSP',

  'SCIS',
  'SCIS',

  'DVUP',
  'DVUP or CC',
]

const GenEdsContainer = () => {
  return (
    <div className='w-full rounded-lg border bg-card shadow-md h-full'>
      <p className="w-full border-b p-1.5 px-3 text-lg font-bold">
        Gen Eds
      </p>
      <table className="w-full">
        <thead className=''>
          <tr className='border-b-2'>
            <th className='text-left px-3 py-1 font-normal text-sm md:text-sm text-muted-foreground'>
              Gen Ed
            </th>
            <th className='border-x text-left px-3 py-1 font-normal text-sm md:text-sm text-muted-foreground'>
              Course
            </th>
            <th className='text-left px-3 py-1 font-normal text-sm md:text-sm text-muted-foreground'>
              Semester
            </th>
          </tr>
        </thead>
        <tbody>
          {GenEds.map((genEd, i) => (
            <React.Fragment key={i}>
              <GenEdRow
                genEd={genEd}
                course={''}
                semester={''}
                isLast={i === GenEds.length - 1}
              />
              {/* Add empty row between gen-ed sections */}
              {((GenEds[i+1]?.charAt(0) !== genEd.charAt(0)) && i !== GenEds.length - 1) && (
                <tr>
                  <td colSpan={3} className='bg-border p-0'>
                    <div className='h-0.5' />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}


interface GenEdRowProps {
  genEd: string
  course?: string
  semester?: string
  alternateBg?: boolean
  isLast?: boolean
}

const GenEdRow = ({
  genEd,
  course,
  semester,
  isLast = false,
}: GenEdRowProps) => {
  return (
    <tr className={`${!isLast ? 'border-b' : ''}`}>
      <td className='px-3 py-1 text-sm md:text-sm text-muted-foreground'>
        {genEd}
      </td>
      <td className='border-x px-3 py-1 text-sm md:text-sm text-muted-foreground'>
        {course}
      </td>
      <td className='px-3 py-1 text-sm md:text-sm text-muted-foreground'>
        {semester}
      </td>
    </tr>
  )
}

export default GenEdsContainer
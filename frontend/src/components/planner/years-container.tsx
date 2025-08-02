'use client';
import { SemesterDateDescriptor, UserInfo } from "@/lib/utils/types";
import Year from "./year";
import { Semester } from "./semester";
import { cn, extractSemester } from "@/lib/utils";
import { SemesterSchema } from "@/lib/utils/schemas";
import { Button, buttonVariants } from "../ui/button";
import { Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createOffTerm } from "@/lib/api/planner/planner.server";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const YearsContainer = ({ userInfo, semesters }: { userInfo: UserInfo | null, semesters: SemesterSchema }) => {
  const router = useRouter();
  if (!userInfo || !userInfo.startSemester || !userInfo.endSemester) return null;
  const academicYears = generateAcademicYears(userInfo);

  const createNewSemester = async (term: "SUMMER" | "WINTER", year: number) => {
    const res = await createOffTerm(term, year);
    if (res.ok) {
      router.refresh();
    } else {
      toast.error("Error creating new semester, please try again");
    }
  };

  return (
    <>
      {academicYears.map(({ year, semesters: yearSemesters }) => (
        <Year key={year} year={year}>
          {yearSemesters.map(semester => (
            <Semester
              key={`${semester.term}-${semester.year}`}
              term={semester.term}
              year={semester.year}
              minNumCourses={semester.term === 'WINTER' || semester.term === "SUMMER" ? 2 : 5}
              courses={extractSemester(semesters, semester.term, semester.year)}
              removable={semester.term === 'WINTER' || semester.term === "SUMMER"}
            />
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`
              ${
                yearSemesters.length === 4 ||
                (
                yearSemesters.length === 3 && (
                  yearSemesters.some(sem => sem.term === 'FALL') && !yearSemesters.some(sem => sem.term === 'SPRING')
                  || yearSemesters.some(sem => sem.term === 'SPRING') && !yearSemesters.some(sem => sem.term === 'FALL')
                ))
                ? "hidden"
                : "block"
              }
              ${yearSemesters.length === 3 ? "col-span-1 h-min mt-0" : "col-span-2"}
              -mt-2.5 -mb-1
              `}
            >
              <Tooltip delayDuration={1500}>
              <TooltipTrigger className={cn(
                buttonVariants({ variant: 'ghost'}),
                "col-span-2 h-5 py-1 group bg-transparent hover:bg-muted transition-all duration-300 ease-out overflow-hidden px-2 w-full"
              )}
              asChild>
                <Plus className="h-4 w-4 text-muted-foreground/60 group-hover:text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="text-sm text-muted-foreground p-1 px-2">
                Add Summer / Winter Semester
              </TooltipContent>
              </Tooltip>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" >
              <DropdownMenuLabel className="font-bold">Select semester to add:</DropdownMenuLabel>
              {!yearSemesters.some(sem => sem.term === 'WINTER') && (
                <DropdownMenuItem className="hover:bg-transparent focus:bg-transparent py-1">
                  <div 
                    className={cn(buttonVariants({ variant: 'outline'}), "w-full text-center cursor-pointer")}
                    onClick={async () => {
                      // Find the Fall semester in this academic year to determine the correct Winter year
                      const fallSemester = yearSemesters.find(sem => sem.term === 'FALL');
                      const springSemester = yearSemesters.find(sem => sem.term === 'SPRING');
                      
                      const winterYear = fallSemester ? fallSemester.year : 
                        // If no Fall semester, calculate based on Spring semester
                        springSemester ? springSemester.year - 1 : 
                        // Fallback calculation
                        year + userInfo.startSemester.year - 1;
                      
                      createNewSemester('WINTER', winterYear);
                    }}
                  >
                    {(() => {
                      const fallSemester = yearSemesters.find(sem => sem.term === 'FALL');
                      const springSemester = yearSemesters.find(sem => sem.term === 'SPRING');
                      
                      const winterYear = fallSemester ? fallSemester.year : 
                        springSemester ? springSemester.year - 1 : 
                        year + userInfo.startSemester.year - 1;
                      return `Winter ${winterYear}`;
                    })()}
                  </div>
                </DropdownMenuItem>
              )}
              {!yearSemesters.some(sem => sem.term === 'SUMMER') && (
                <DropdownMenuItem className="hover:bg-transparent focus:bg-transparent py-1">
                  <div 
                    className={cn(buttonVariants({ variant: 'outline'}), "w-full text-center cursor-pointer")}
                    onClick={async () => {
                      // Find the Spring semester in this academic year to determine the correct Summer year
                      const springSemester = yearSemesters.find(sem => sem.term === 'SPRING');
                      const fallSemester = yearSemesters.find(sem => sem.term === 'FALL');
                      
                      const summerYear = springSemester ? springSemester.year : 
                        // If no Spring semester, calculate based on Fall semester
                        fallSemester ? fallSemester.year + 1 : 
                        // Fallback calculation
                        year + userInfo.startSemester.year;
                      
                      createNewSemester('SUMMER', summerYear);
                    }}
                  >
                    {(() => {
                      const springSemester = yearSemesters.find(sem => sem.term === 'SPRING');
                      const fallSemester = yearSemesters.find(sem => sem.term === 'FALL');
                      
                      const summerYear = springSemester ? springSemester.year : 
                        fallSemester ? fallSemester.year + 1 : 
                        year + userInfo.startSemester.year;
                      return `Summer ${summerYear}`;
                    })()}
                  </div>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </Year>
      ))}
    </>
  )
};
// Generate all semesters between start and end, grouped by academic year
const generateAcademicYears = (userInfo: UserInfo): { year: number; semesters: SemesterDateDescriptor[] }[] => {
  const academicYears: { year: number; semesters: SemesterDateDescriptor[] }[] = [];
  let currentSemester = { ...userInfo.startSemester };
  let academicYearNumber = 1;
  let currentAcademicYear: SemesterDateDescriptor[] = [];
  
  // Create a set of off semesters for quick lookup
  const offSemesterSet = new Set(
    userInfo.offSemesters?.map(sem => `${sem.term}_${sem.year}`)
  );
  
  // Helper function to add off semesters for a given academic year
  const addOffSemestersForYear = (fallYear: number) => {
    const winterKey = `WINTER_${fallYear}`;
    const summerKey = `SUMMER_${fallYear + 1}`;
    
    // Add winter semester if it exists in off semesters
    if (offSemesterSet.has(winterKey)) {
      currentAcademicYear.push({ term: 'WINTER', year: fallYear });
    }
    
    // Add summer semester if it exists in off semesters
    if (offSemesterSet.has(summerKey)) {
      currentAcademicYear.push({ term: 'SUMMER', year: fallYear + 1 });
    }
  };
  
  // Helper function to determine if we should start a new academic year
  const shouldStartNewAcademicYear = (semester: SemesterDateDescriptor) => {
    // Only start new academic year on Fall, and only if we have semesters in current year
    return semester.term === 'FALL' && currentAcademicYear.length > 0;
  };
  
  while (true) {
    // Check if we should start a new academic year BEFORE adding the current semester
    if (shouldStartNewAcademicYear(currentSemester)) {
      academicYears.push({ year: academicYearNumber, semesters: currentAcademicYear });
      academicYearNumber++;
      currentAcademicYear = [];
    }
    
    currentAcademicYear.push({ ...currentSemester });
    
    // Check if we've reached the end
    if (currentSemester.term === userInfo.endSemester.term &&
        currentSemester.year === userInfo.endSemester.year) {
      
      // Add any remaining off semesters for this academic year
      if (currentSemester.term === 'FALL') {
        addOffSemestersForYear(currentSemester.year);
      } else if (currentSemester.term === 'SPRING') {
        // For Spring, we need to check the previous Fall year for winter/summer
        addOffSemestersForYear(currentSemester.year - 1);
      }
      
      academicYears.push({ year: academicYearNumber, semesters: currentAcademicYear });
      break;
    }
    
    // Move to next semester
    if (currentSemester.term === 'FALL') {
      currentSemester = { term: 'SPRING', year: currentSemester.year + 1 };
    } else if (currentSemester.term === 'SPRING') {
      // After Spring, add off semesters for this academic year before moving to next Fall
      const fallYear = currentSemester.year - 1;
      addOffSemestersForYear(fallYear);
      
      // Move to next Fall
      currentSemester = { term: 'FALL', year: currentSemester.year };
    } else if (currentSemester.term === 'SUMMER') {
      currentSemester = { term: 'FALL', year: currentSemester.year };
    } else if (currentSemester.term === 'WINTER') {
      currentSemester = { term: 'SPRING', year: currentSemester.year + 1 };
    }
  }
  
  return academicYears;
};

export default YearsContainer
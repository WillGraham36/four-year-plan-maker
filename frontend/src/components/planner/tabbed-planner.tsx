'use client';

import { SemesterDateDescriptor, UserInfo } from "@/lib/utils/types";
import Year from "./year";
import { Semester } from "./semester";
import { cn, extractSemester } from "@/lib/utils";
import { GenEdList, SemesterSchema } from "@/lib/utils/schemas";
import { Button, buttonVariants } from "../ui/button";
import { Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createOffTerm } from "@/lib/api/planner/planner.server";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AccordionProvider } from "../context/accordion-context";
import GenEdsContainer from '@/components/gen-eds/gen-eds-container';
import TotalCreditsContainer from '@/components/planner/total-credits-container';
import TransferCreditsContainer from '@/components/planner/transfer-credits-container';
import UpperLevelConcentrationContainer from '@/components/ul-concentration/ul-concentration';
import Notes from '@/components/planner/notes';

interface TabbedPlannerProps {
  userInfo: UserInfo | null;
  semesters: SemesterSchema;
  concentration: string;
}

const TabbedPlanner = ({ 
  userInfo, 
  semesters, 
  concentration, 
}: TabbedPlannerProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const activeTab = searchParams.get('tab') || 'year-1';
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    router.push(`/planner?${params.toString()}`);
  };
  
  const renderYearContent = (yearData: { year: number; semesters: SemesterDateDescriptor[] }, isLast: boolean) => {
    const { year, semesters: yearSemesters } = yearData;
    
    return (
      <Year key={year} year={year} isLast={isLast}>
        {yearSemesters.map(semester => (
          <Semester
            key={`${semester.term}-${semester.year}`}
            term={semester.term}
            year={semester.year}
            minNumCourses={semester.term === 'WINTER' ? 1 : semester.term === "SUMMER" ? 1 : 5}
            courses={extractSemester(semesters, semester.term, semester.year)}
            removable={semester.term === 'WINTER' || semester.term === "SUMMER"}
            maxCourses={semester.term === 'WINTER' ? 1 : semester.term === "SUMMER" ? 3 : 8}
          />
        ))}
        
        <DropdownMenu>
          <DropdownMenuTrigger
            className={`${
              yearSemesters.length === 4 ||
              (yearSemesters.length === 3 &&
                ((yearSemesters.some(sem => sem.term === 'FALL') &&
                  !yearSemesters.some(sem => sem.term === 'SPRING')) ||
                  (yearSemesters.some(sem => sem.term === 'SPRING') &&
                    !yearSemesters.some(sem => sem.term === 'FALL'))))
                ? "hidden"
                : "block"
            } ${yearSemesters.length === 3 ? "col-span-1 h-min mt-0" : "col-span-2"} -mt-2.5 -mb-1`}
          >
            <Tooltip delayDuration={1500}>
              <TooltipTrigger
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  "col-span-2 h-5 py-1 group bg-transparent hover:bg-muted transition-all duration-300 ease-out overflow-hidden px-2 w-full"
                )}
                asChild
              >
                <Plus className="h-4 w-4 text-muted-foreground/60 group-hover:text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="text-sm text-muted-foreground p-1 px-2">
                Add Summer / Winter Semester
              </TooltipContent>
            </Tooltip>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-64">
            <DropdownMenuLabel className="font-bold">Select semester to add:</DropdownMenuLabel>
            
            {!yearSemesters.some(sem => sem.term === 'WINTER') && (
              <DropdownMenuItem className="hover:bg-transparent focus:bg-transparent py-1">
                <div
                  className={cn(buttonVariants({ variant: 'outline' }), "w-full text-center cursor-pointer")}
                  onClick={async () => {
                    const fallSemester = yearSemesters.find(sem => sem.term === 'FALL');
                    const springSemester = yearSemesters.find(sem => sem.term === 'SPRING');
                    const winterYear = fallSemester ? fallSemester.year + 1 :
                      springSemester ? springSemester.year :
                      year + userInfo.startSemester.year;
                    createNewSemester('WINTER', winterYear);
                  }}
                >
                  {(() => {
                    const fallSemester = yearSemesters.find(sem => sem.term === 'FALL');
                    const springSemester = yearSemesters.find(sem => sem.term === 'SPRING');
                    const winterYear = fallSemester ? fallSemester.year + 1 :
                      springSemester ? springSemester.year :
                      year + userInfo.startSemester.year;
                    return `Winter ${winterYear}`;
                  })()}
                </div>
              </DropdownMenuItem>
            )}
            
            {!yearSemesters.some(sem => sem.term === 'SUMMER') && (
              <DropdownMenuItem className="hover:bg-transparent focus:bg-transparent py-1">
                <div
                  className={cn(buttonVariants({ variant: 'outline' }), "w-full text-center cursor-pointer")}
                  onClick={async () => {
                    const springSemester = yearSemesters.find(sem => sem.term === 'SPRING');
                    const fallSemester = yearSemesters.find(sem => sem.term === 'FALL');
                    const summerYear = springSemester ? springSemester.year :
                      fallSemester ? fallSemester.year + 1 :
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
    );
  };

  const renderAsideContent = () => (
    <div className='flex flex-col w-full gap-4 mt-2'>
      <TotalCreditsContainer />
      <GenEdsContainer />
      {userInfo?.major === "Computer Science" && <UpperLevelConcentrationContainer concentration={concentration} />}
      <Notes note={userInfo?.note} />
      <TransferCreditsContainer courses={extractSemester(semesters, 'TRANSFER', -1)} />
    </div>
  );

  return (
    <AccordionProvider>
      {/* Mobile/Tablet Layout - Tabs (visible below lg) */}
      <div className="lg:hidden">
        <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex flex-col gap-2">
            {/* Year tabs in a row */}
            <TabsList className="w-full">
              {academicYears.map(({ year }) => (
                <TabsTrigger
                  key={year}
                  value={`year-${year}`}
                  className="text-xs flex-1"
                >
                  Year {year}
                </TabsTrigger>
              ))}
              <TabsTrigger value="requirements" className="text-xs flex-1 hidden md:block">
                Requirements
              </TabsTrigger>
            </TabsList>
            
            {/* Requirements tab below, full width */}
            <TabsList className="w-full block md:hidden">
              <TabsTrigger value="requirements" className="text-xs w-full">
                Requirements
              </TabsTrigger>
            </TabsList>
          </div>
          
          {academicYears.map((yearData, index) => (
            <TabsContent
              key={yearData.year}
              value={`year-${yearData.year}`}
              className="min-h-[400px] mt-4"
            >
              {renderYearContent(yearData, index === academicYears.length - 1)}
            </TabsContent>
          ))}
          
          <TabsContent value="requirements" className="min-h-[400px] mt-4">
            {renderAsideContent()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Layout - All years and aside content visible (visible lg and above) */}
      <div className="hidden lg:flex lg:gap-4">
        <div className='flex flex-col w-full lg:w-[60%]'>
          {academicYears.map((yearData, index) => renderYearContent(yearData, index === academicYears.length - 1))}
        </div>
        <div className='w-full lg:w-[40%]'>
          {renderAsideContent()}
        </div>
      </div>
    </AccordionProvider>
  );
};

// Generate all semesters between start and end, grouped by academic year
export const generateAcademicYears = (userInfo: UserInfo): { year: number; semesters: SemesterDateDescriptor[] }[] => {
  const academicYears: { year: number; semesters: SemesterDateDescriptor[] }[] = [];
  let currentSemester = { ...userInfo.startSemester };
  let academicYearNumber = 1;
  let currentAcademicYear: SemesterDateDescriptor[] = [];

  const offSemesterSet = new Set(
    userInfo.offSemesters?.map(sem => `${sem.term}_${sem.year}`)
  );

  const addOffSemestersForYear = (fallYear: number) => {
    const winterKey = `WINTER_${fallYear + 1}`;
    const summerKey = `SUMMER_${fallYear + 1}`;

    if (offSemesterSet.has(winterKey)) {
      currentAcademicYear.push({ term: 'WINTER', year: fallYear + 1 });
    }

    if (offSemesterSet.has(summerKey)) {
      currentAcademicYear.push({ term: 'SUMMER', year: fallYear + 1 });
    }
  };

  const shouldStartNewAcademicYear = (semester: SemesterDateDescriptor) => {
    return semester.term === 'FALL' && currentAcademicYear.length > 0;
  };

  while (true) {
    if (shouldStartNewAcademicYear(currentSemester)) {
      academicYears.push({ year: academicYearNumber, semesters: currentAcademicYear });
      academicYearNumber++;
      currentAcademicYear = [];
    }

    currentAcademicYear.push({ ...currentSemester });

    if (currentSemester.term === userInfo.endSemester.term && currentSemester.year === userInfo.endSemester.year) {
      if (currentSemester.term === 'FALL') {
        addOffSemestersForYear(currentSemester.year);
      } else if (currentSemester.term === 'SPRING') {
        addOffSemestersForYear(currentSemester.year - 1);
      }
      academicYears.push({ year: academicYearNumber, semesters: currentAcademicYear });
      break;
    }

    if (currentSemester.term === 'FALL') {
      currentSemester = { term: 'SPRING', year: currentSemester.year + 1 };
    } else if (currentSemester.term === 'SPRING') {
      const fallYear = currentSemester.year - 1;
      addOffSemestersForYear(fallYear);
      currentSemester = { term: 'FALL', year: currentSemester.year };
    } else if (currentSemester.term === 'SUMMER') {
      currentSemester = { term: 'FALL', year: currentSemester.year };
    } else if (currentSemester.term === 'WINTER') {
      currentSemester = { term: 'SPRING', year: currentSemester.year + 1 };
    }
  }

  return academicYears;
};

export default TabbedPlanner;
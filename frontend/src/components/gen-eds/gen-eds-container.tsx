"use client";
import { termYearToString } from "@/lib/utils";
import React from "react";
import { useRequirements } from "../context/requirements-context";
import SatisfiedCheck from "../ui/satisfied-check";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import DefaultOpenAccordion from "../ui/default-open-accordion";

const GenEdsContainer = () => {
  const { genEdRequirements, completedSemesters } = useRequirements();

  const allGenEdsSatisfied = genEdRequirements.every(
    ({ courseId }) => courseId && courseId.trim() !== "",
  );

  return (
    <aside className="w-full rounded-lg border bg-card shadow-md h-full">
      <DefaultOpenAccordion
        triggerClassName="flex items-center gap-2 data-[state=open]:border-b p-2 px-3 border-b-1"
        trigger={
          <div className="flex items-center gap-2">
            <SatisfiedCheck
              isChecked={allGenEdsSatisfied}
              uncheckedMessage="You need to complete all Gen Eds to satisfy this requirement"
              checkedMessage="You meet the Gen Ed requirements!"
            />
            <p className="w-full font-semibold text-lg">Gen Eds</p>
          </div>
        }
        contentClassName="pb-0 rounded-lg overflow-hidden"
        content={
          <div className="flex flex-col">
            <div className="grid grid-cols-[1fr_2fr_7rem] border-b">
              <p className="text-left px-3 py-1 font-normal text-sm md:text-sm text-muted-foreground">
                Gen Ed
              </p>
              <p className="border-x text-left px-3 py-1 font-normal text-sm md:text-sm text-muted-foreground">
                Course
              </p>
              <p className="text-left px-3 py-1 font-normal text-sm md:text-sm text-muted-foreground">
                Semester
              </p>
            </div>

            <div className="grid grid-cols-[1fr_2fr_7rem]">
              {genEdRequirements.map(({ requirementName, courseId, semesterName, transferCreditName }, i) => {
                const [term, year] = semesterName.split(" ");
                return (
                  <React.Fragment key={i}>
                    <GenEdRow
                      genEd={requirementName}
                      course={
                        transferCreditName
                          ? `${courseId} | ${transferCreditName}`
                          : courseId
                      }
                      semester={termYearToString(semesterName)}
                      isLast={i === genEdRequirements.length - 1}
                      completed={completedSemesters.some(
                        (sem) =>
                          sem.term === term && sem.year === parseInt(year),
                      )}
                    />
                    {/* Add empty row between gen-ed sections */}
                    {/* {((GenEds[i+1]?.charAt(0) !== genEd.charAt(0)) && i !== GenEds.length - 1) && (
                          <div className='bg-border p-0 h-0.5'>
                          </div>
                      )} */}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        }
        accordion={
          <Accordion type="single" collapsible defaultValue="gen-eds">
            <AccordionItem
              value={`gen-eds`}
              className="border-b-0"
            ></AccordionItem>
          </Accordion>
        }
      />
    </aside>
  );
};

const getSharedClasses = (isLast: boolean, completed: boolean) =>
  `px-3 py-1 text-sm md:text-sm text-muted-foreground bg-background transition-all duration-200 ${!isLast ? "border-b" : ""} ${completed ? "bg-green-500/15 dark:bg-green-800/15" : ""}`;
interface GenEdRowProps {
  genEd: string;
  course?: string;
  semester?: string;
  alternateBg?: boolean;
  isLast?: boolean;
  completed?: boolean;
}

const GenEdRow = ({
  genEd,
  course,
  semester,
  isLast = false,
  completed = false,
}: GenEdRowProps) => {
  return (
    <React.Fragment>
      <p
        className={getSharedClasses(
          isLast,
          completed || semester === "Transfer",
        )}
      >
        {genEd}
      </p>
      <p
        className={`${getSharedClasses(isLast, completed || semester === "Transfer")} border-x break-all`}
      >
        {course?.includes("|") ? (
          <>
            <span className="w-20 inline-block">{course.split("|")[0]}</span>
            <span className="pr-2">|</span>
            {course.slice(course.indexOf("|") + 1)}
          </>
        ) : (
          <span className="font-normal">{course}</span>
        )}
      </p>
      <p
        className={getSharedClasses(
          isLast,
          completed || semester === "Transfer",
        )}
      >
        {semester}
      </p>
    </React.Fragment>
  );
};

export default GenEdsContainer;

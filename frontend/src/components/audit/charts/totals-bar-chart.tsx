import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, LabelList } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useChartsInfo } from "./charts-context"
import { useRequirements } from "@/components/context/requirements-context"
import { assignGenEdsToRequirements, GenEdListForRendering } from "@/components/gen-eds/gen-eds-container"

const chartConfig = {
  completed: {
    label: "Completed",
    color: "var(--completed)", // Green
  },
  planned: {
    label: "Planned", 
    color: "var(--planned)", // Yellow/Orange
  },
} satisfies ChartConfig

const TotalsBarChart = () => {
  const { allCourses } = useChartsInfo();
  const { completedSemesters, ULCourses, genEds } = useRequirements();

  // Total credits
  let totalPlannedCredits = 0;
  let totalCompletedCredits = 0;
  const completedSemesterNames = new Set(completedSemesters.map(sem => sem.term + ' ' + sem.year));
  allCourses.forEach(course => {
    const credits = course.credits || 0;
    const isCompleted = course.semester === "Transfer Credit" || completedSemesterNames.has(course.semester.toUpperCase());
    
    if (isCompleted) {
      totalCompletedCredits += credits;
    } else {
      totalPlannedCredits += credits;
    }
  });

  // UL Credits
  let totalPlannedULCredits = 0;
  let totalCompletedULCredits = 0;
  ULCourses.forEach(course => {
    const credits = course.credits || 0;
    const isCompleted = completedSemesterNames.has(course.semester.term + ' ' + course.semester.year);

    if (isCompleted) {
      totalCompletedULCredits += credits;
    } else {
      totalPlannedULCredits += credits;
    }
  });

  // Gen Eds calculation
  const assignedGenEds = assignGenEdsToRequirements(genEds);
  let completedGenEds = 0;
  let plannedGenEds = 0;

  GenEdListForRendering.forEach((requiredGenEd, index) => {
    const assignment = assignedGenEds[index];
    
    if (assignment && assignment.courseId && assignment.courseId.trim() !== '') {
      // Check if this GenEd is completed
      const [term, year] = assignment.semesterName.split(' ');
      const isCompleted = assignment.semesterName === 'TRANSFER -1' || completedSemesters.some(sem => 
        sem.term === term && sem.year === parseInt(year)
      );
      if (isCompleted) {
        completedGenEds++;
      } else {
        plannedGenEds++;
      }
    }
    // If no courseId, it's neither completed nor planned (unfulfilled requirement)
  });

  const chartData = [
    { 
      category: "Total Credits", 
      completed: Math.round((totalCompletedCredits / 120) * 100),
      planned: Math.round((totalPlannedCredits / 120) * 100),
      totalCount: 120,
      rawCompleted: totalCompletedCredits,
      rawPlanned: totalPlannedCredits
    },
    { 
      category: "Gen Eds", 
      completed: Math.round((completedGenEds / GenEdListForRendering.length) * 100),
      planned: Math.round((plannedGenEds / GenEdListForRendering.length) * 100),
      totalCount: GenEdListForRendering.length,
      rawCompleted: completedGenEds,
      rawPlanned: plannedGenEds
    },
    { 
      category: "Major Requirements", 
      completed: Math.round((6 / 15) * 100), // 6/15 = 40%
      planned: Math.round((6 / 15) * 100),   // 6/15 = 40%
      totalCount: 15,
      rawCompleted: 6,
      rawPlanned: 6
    },
    { 
      category: "Upper Level Concentration", 
      completed: Math.round((totalCompletedULCredits / 12) * 100),
      planned: Math.round((totalPlannedULCredits / 12) * 100),
      totalCount: 12,
      rawCompleted: totalCompletedULCredits,
      rawPlanned: totalPlannedULCredits
    },
  ]


  return (
    <ChartContainer config={chartConfig} className='w-full md:flex-1 max-md:max-h-72'>
      <BarChart 
        accessibilityLayer 
        data={chartData} 
        layout='vertical'
        margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis 
          type="number"
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <YAxis
          type="category"
          dataKey="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          width={90}
          tick={{ textAnchor: 'middle', dx: -30  }}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent 
              hideLabel  
              formatter={(value, name, item, index) => (
                <>
                  {index === 0 && (
                    <p className="w-full font-bold">{item.payload.category}</p>
                  )}
                  <div className={`h-2.5 w-2.5 shrink-0 rounded-[2px] ${name === 'completed' ? 'bg-[var(--completed)]' : 'bg-[var(--planned)]'}`}
                  />
                  {chartConfig[name as keyof typeof chartConfig]?.label || name}
                  <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-medium tabular-nums">
                    {name === 'completed' 
                      ? item.payload.rawCompleted
                      : item.payload.rawPlanned
                    }
                    <span className="text-muted-foreground font-normal">
                      {name === 'completed' ? ' completed' : ' planned'}
                    </span>
                  </div>
                  
                  {/* Add total after the last item */}
                  {index === 1 && (
                    <div className="text-foreground mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium">
                      Total
                      <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-medium tabular-nums">
                          {Math.round((item.payload.rawCompleted + item.payload.rawPlanned) / item.payload.totalCount * 100)}%
                        <span className="text-muted-foreground font-normal">
                          ({item.payload.rawCompleted + item.payload.rawPlanned}/{item.payload.totalCount})
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        
        {/* Completed portion */}
        <Bar
          dataKey="completed"
          stackId="a"
          fill="var(--color-completed)"
          radius={[0, 0, 0, 0]}
        />
        
        {/* Planned portion */}
        <Bar
          dataKey="planned"
          stackId="a"
          fill="var(--color-planned)"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}

export default TotalsBarChart
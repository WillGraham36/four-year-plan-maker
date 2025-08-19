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
  const { completedSemesters } = useRequirements();

  let totalPlannedCredits = 0;
  let totalCompletedCredits = 0;

  // Create a set of completed semester names for quick lookup
  const completedSemesterNames = new Set(completedSemesters.map(sem => sem.term + ' ' + sem.year));

  allCourses.forEach(course => {
    const credits = course.credits || 0;

    // Check if course is completed
    const isCompleted = course.semester === "Transfer Credit" || completedSemesterNames.has(course.semester.toUpperCase());
    
    if (isCompleted) {
      totalCompletedCredits += credits;
    } else {
      totalPlannedCredits += credits;
    }
  });

  const chartData = [
    { 
      category: "Total Credits", 
      completed: totalCompletedCredits,
      planned: totalPlannedCredits,
      totalCount: 120
    },
    { 
      category: "Gen Eds", 
      completed: 70, // 14/20 = 70%
      planned: 20,   // 4 more planned
      totalCount: 20
    },
    { 
      category: "Major Requirements", 
      completed: 40, // 6/15 = 40%
      planned: 40,   // 6 more planned
      totalCount: 15
    },
    { 
      category: "Upper Level Concentration", 
      completed: 40, // 6/15 = 40%
      planned: 40,   // 6 more planned
      totalCount: 15
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
                      ? item.payload.completed
                      : item.payload.planned
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
                        {item.payload.completed + item.payload.planned}%
                        <span className="text-muted-foreground font-normal">
                          ({Math.round(item.payload.totalCount * (item.payload.completed + item.payload.planned) / 100)}/{item.payload.totalCount})
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
import React from 'react'
import { LabelList, RadialBar, RadialBarChart } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useChartsInfo } from './charts-context'
import { useMajorRequirements } from '@/components/context/major-requirements-context'

const chartConfig = {
  areas: {
    label: "Areas",
    color: "var(--chart-1)",
  },
  concentration: {
    label: "Concentration",
    color: "var(--chart-2)",
  },
  lowerLevel: {
    label: "Lower Level Reqs.",
    color: "var(--chart-3)",
  },
  upperLevel: {
    label: "Upper Level Reqs.",
    color: "var(--chart-4)",
  },
  planned: {
    label: "In Progress",
    color: "var(--chart-5)",
  },
  completed: {
    label: "Completed",
    color: "var(--chart-6)",
  },
} satisfies ChartConfig

const DegreeChart = () => {
  const { upperLevelCreditsData } = useChartsInfo();
  const { areas, lowerLevel, trackRequirements } = useMajorRequirements();

  let lowerLevelPlanned = 0;
  let lowerLevelCompleted = 0;
  lowerLevel.cs.forEach(course => { if (course.completed) { lowerLevelCompleted++; } else { lowerLevelPlanned++; } });
  lowerLevel.math.forEach(course => { if (course.completed) { lowerLevelCompleted++; } else { lowerLevelPlanned++; } });

  let upperLevelPlanned = 0;
  let upperLevelCompleted = 0;
  let upperLevelTotal = trackRequirements.requirements.length;
  trackRequirements.requirements.forEach(req => {
    if(req.progress) {
      upperLevelTotal += req.progress.total - 1;
    }
    if (req.completed) {
      upperLevelCompleted++;
    } else if(req.planned) {
      upperLevelPlanned++;
    } else if(req.progress) {
      upperLevelPlanned += req.progress.current;
    }
  });

  const rawChartData = [
    { category: "Areas", complete: areas.completedCount, planned: areas.plannedCount, total: 3 },
    { category: "Concentration", complete: upperLevelCreditsData.completed, planned: upperLevelCreditsData.planned, total: 12 },
    { category: "Lower Level Reqs.", complete: lowerLevelCompleted, planned: lowerLevelPlanned, total: lowerLevel.cs.length + lowerLevel.math.length },
    { category: "Upper Level Reqs.", complete: upperLevelCompleted, planned: upperLevelPlanned, total: upperLevelTotal },
  ];

  // normalize to percentages so every row fills 100%
  const usedChartData = rawChartData.map(row => {
    const completePct = (row.complete / row.total) * 100;
    const plannedPct = (row.planned / row.total) * 100;
    return {
      ...row,
      completePct,
      plannedPct,
    };
  });

  const labelChartData = rawChartData.map(row => ({
    category: row.category,
    labelArc: 100, // full arc just for positioning labels
  }));


  return (
    <div className='w-full md:flex-1 max-md:max-h-72 relative'>
      <ChartContainer
        config={chartConfig}
        className='w-full h-full max-md:max-h-72 '
      >
        <RadialBarChart data={usedChartData} innerRadius={'25%'} outerRadius={'100%'} startAngle={-90} endAngle={270}>
          <RadialBar dataKey="completePct" stackId="a" background fill='var(--completed)' cornerRadius={5}/>
          <RadialBar dataKey="plannedPct" stackId="a" fill='var(--planned)' cornerRadius={5}/>

          <ChartLegend
            align='center'
            content={<ChartLegendContent />}
            payload={[
              { value: 'Completed', dataKey: 'completed', type: 'rect', color: 'var(--completed)' },
              { value: 'In Progress', dataKey: 'planned', type: 'rect', color: 'var(--planned)' },
            ]}
          />
          <ChartTooltip
            cursor={false}
            content={({ active, payload, label, coordinate }) => {
              if (!active || !payload) return null;

              // coordinate = { x, y } of mouse
              const offsetX = 20; // px to the right
              const offsetY = -20; // px up

              return (
                <div
                  className="absolute z-[9999] rounded-md bg-background shadow-lg p-2 text-sm min-w-60 flex flex-col gap-1.5"
                  style={{
                    left: (coordinate?.x || 0) + offsetX,
                    top: (coordinate?.y || 0) + offsetY,
                    pointerEvents: "none", // don’t block chart hover
                    position: "absolute",
                  }}
                >
                  {/* Your custom tooltip content */}
                  <p className="font-bold text-sm">{payload[0]?.payload.category}</p>
                  {payload.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: entry.color }}
                      />
                      <p>
                        {entry.name === "completePct"
                          ? `Completed`
                          : `Planned`}
                      </p>
                      <p className="ml-auto">
                        {entry.payload[entry.name === "completePct"
                          ? `complete`
                          : `planned`] ?? 0}
                        <span className='text-muted-foreground'>
                          {entry.name === "completePct"
                            ? ` completed`
                            : ` planned`}
                        </span>
                      </p>
                    </div>
                  ))}
                  <div className="border-t pt-1 mt-1.5 text-xs w-full flex items-center justify-between font-semibold">
                    Total
                    <div>
                      {Math.round(
                      (((payload[0]?.payload.complete ?? 0) + (payload[0]?.payload.planned ?? 0)) /
                        (payload[0]?.payload.total ?? 1)) * 100
                      )}% 
                      <span className='text-muted-foreground font-normal'>
                        (
                        {(payload[0]?.payload.complete ?? 0) + (payload[0]?.payload.planned ?? 0)}/
                        {payload[0]?.payload.total ?? 1}
                        )
                      </span>
                    </div>
                  </div>
                </div>
              );
            }}
          />

        </RadialBarChart>
      </ChartContainer>

      <ChartContainer
        config={chartConfig}
        className='hidden sm:block md:hidden lg:block absolute top-0 w-full h-full max-md:max-h-72 pointer-events-none'
      >
        <RadialBarChart data={labelChartData} innerRadius={'22%'} outerRadius={'92%'} startAngle={0} endAngle={-90}>
          <RadialBar 
            dataKey="labelArc"
            stackId="labels"
            fill="transparent" // invisible but real arc
            isAnimationActive={false} // prevent flicker
          >
            <LabelList
              dataKey="category"
              position="insideEnd"
              className="fill-white capitalize"
              fontSize={11}
            />
          </RadialBar>
        </RadialBarChart>
      </ChartContainer>
    </div>
  )
}

export default DegreeChart
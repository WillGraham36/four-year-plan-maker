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
    label: "Planned",
    color: "var(--chart-5)",
  },
  completed: {
    label: "Completed",
    color: "var(--chart-6)",
  },
} satisfies ChartConfig

const DegreeChart = () => {
  const { upperLevelCreditsData } = useChartsInfo();

  const usedChartData = [
    { category: "Areas", complete: 275, planned: 100, labelArc: 100 },
    { category: "Concentration", complete: upperLevelCreditsData.completed, planned: upperLevelCreditsData.planned, labelArc: 100 },
    { category: "Lower Level Reqs.", complete: 0, planned: 120, labelArc: 100 },
    { category: "Upper Level Reqs.", complete: 173, planned: 0, labelArc: 100 },
  ];



  return (
    <div className='w-full md:flex-1 max-md:max-h-72 relative'>
      <ChartContainer
        config={chartConfig}
        className='w-full h-full'
      >
        <RadialBarChart data={usedChartData} innerRadius={40} outerRadius={160} barSize={25} startAngle={-90} endAngle={270}>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel nameKey="category" className='z-[9999]' />}
          />
          <RadialBar dataKey="complete" stackId="a" background fill='var(--completed)' cornerRadius={5}/>
          <RadialBar dataKey="planned" stackId="a" fill='var(--planned)' cornerRadius={5}/>

          <ChartLegend
            className=''
            align='center'
            content={<ChartLegendContent />}
            payload={[
              { value: 'Completed', dataKey: 'completed', type: 'rect', color: 'var(--completed)' },
              { value: 'Planned', dataKey: 'planned', type: 'rect', color: 'var(--planned)' },
            ]}
          />
        </RadialBarChart>
      </ChartContainer>

      <ChartContainer
        config={chartConfig}
        className='absolute top-0 w-full h-full pointer-events-none'
      >
        <RadialBarChart data={usedChartData} innerRadius={40} outerRadius={160} barSize={25} startAngle={0} endAngle={-90}>
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
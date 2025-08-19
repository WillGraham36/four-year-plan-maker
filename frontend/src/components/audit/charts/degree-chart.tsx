import React from 'react'
import { RadialBar, RadialBarChart } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { category: "chrome", complete: 275, planned: 100 },
  { category: "safari", complete: 200, planned: 150 },
  { category: "firefox", complete: 187, planned: 120 },
  { category: "edge", complete: 173, planned: 130 },
  { category: "other", complete: 90, planned: 80 },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)",
  },
  safari: {
    label: "Safari", 
    color: "var(--chart-2)",
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)",
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

const DegreeChart = () => {
  return (
    <ChartContainer
      config={chartConfig}
      className="w-full md:flex-1 max-md:max-h-72"
    >
      <RadialBarChart data={chartData} innerRadius={30} startAngle={180} endAngle={-180}>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="category" />}
        />

        <RadialBar dataKey="complete" stackId="a" fill='var(--completed)' />
        <RadialBar dataKey="planned" stackId="a" fill='var(--planned)' />

        <ChartLegend
          className=''
          align='center'
          content={<ChartLegendContent />}
          payload={[
            { value: 'chrome', dataKey: 'chrome', type: 'rect', color: 'var(--chart-1)' },
            { value: 'safari', dataKey: 'safari', type: 'rect', color: 'var(--chart-2)' },
            { value: 'firefox', dataKey: 'firefox', type: 'rect', color: 'var(--chart-3)' },
            { value: 'edge', dataKey: 'edge', type: 'rect', color: 'var(--chart-4)' },
            { value: 'other', dataKey: 'other', type: 'rect', color: 'var(--chart-5)' }
          ]}
        />
      </RadialBarChart>
    </ChartContainer>
  )
}

export default DegreeChart
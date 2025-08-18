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
  { category: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { category: "safari", visitors: 200, fill: "var(--color-safari)" },
  { category: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { category: "edge", visitors: 173, fill: "var(--color-edge)" },
  { category: "other", visitors: 90, fill: "var(--color-other)" },
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
      className=""
    >
      <RadialBarChart data={chartData} innerRadius={30} outerRadius={110}>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="category" />}
        />
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
        <RadialBar dataKey="visitors" background />
      </RadialBarChart>
    </ChartContainer>
  )
}

export default DegreeChart
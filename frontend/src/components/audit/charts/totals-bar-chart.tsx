import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, LabelList } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Updated data structure for your requirements
const chartData = [
  { 
    category: "Total Credits", 
    completed: 50, // 60/120 = 50%
    planned: 25,   // 30 more credits planned
    displayText: "60/120",
    completedCount: 60,
    totalCount: 120
  },
  { 
    category: "Major Courses", 
    completed: 70, // 14/20 = 70%
    planned: 20,   // 4 more planned
    displayText: "14/20",
    completedCount: 14,
    totalCount: 20
  },
  { 
    category: "Gen Eds", 
    completed: 40, // 6/15 = 40%
    planned: 40,   // 6 more planned
    displayText: "6/15",
    completedCount: 6,
    totalCount: 15
  },
]

const chartConfig = {
  completed: {
    label: "Completed",
    color: "var(--chart-1)", // Green
  },
  planned: {
    label: "Planned", 
    color: "var(--chart-3)", // Yellow/Orange
  },
} satisfies ChartConfig

// Custom label component to show the count on bars
const CustomLabel = (props: any) => {
  const { x, y, width, height, payload } = props;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  return (
    <text 
      x={centerX} 
      y={centerY} 
      fill="#000" 
      textAnchor="middle" 
      dominantBaseline="middle"
      fontSize={12}
      fontWeight="500"
    >
      {payload.displayText}
    </text>
  );
};

const TotalsBarChart = () => {
  return (
    <ChartContainer config={chartConfig} className='max-h-72'>
      <BarChart 
        accessibilityLayer 
        data={chartData} 
        layout='vertical'
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
          width={80}
        />
        <ChartTooltip 
          content={
            <ChartTooltipContent 
              hideLabel={false}
              formatter={(value, name, props) => [
                `${value}% (${Math.round(props.payload.completedCount * Number(value) / (props.payload.completed || 1))}/${props.payload.totalCount})`,
                name
              ]}
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
        >
          {/* <LabelList
            dataKey="completed"
            position="insideLeft"
            offset={8}
            className="fill-(--color-label)"
            fontSize={12}
          >
            <CustomLabel />
          </LabelList> */}
        </Bar>
        
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
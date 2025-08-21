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
  const { chartData } = useChartsInfo();

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
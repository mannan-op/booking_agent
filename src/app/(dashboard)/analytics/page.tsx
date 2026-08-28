"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import { PageHeader } from "@/components/shared/page-header"
import { PageSkeleton } from "@/components/shared/table-skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useLiveData } from "@/hooks/use-live-data"
import type { BatterySalesShare, QueryStat, SalesPoint } from "@/types"

const salesConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig

const modelConfig = {
  units: { label: "Units sold", color: "var(--chart-1)" },
} satisfies ChartConfig

const queryConfig = {
  completed: { label: "Completed", color: "var(--chart-2)" },
  processing: { label: "Processing", color: "var(--chart-1)" },
  review: { label: "Human Review", color: "var(--chart-4)" },
} satisfies ChartConfig

export default function AnalyticsPage() {
  const { data, isLoading, error } = useLiveData<{
    salesOverview: SalesPoint[]
    topBatteryModels: BatterySalesShare[]
    queryStats: QueryStat[]
    orderCompletion: { completed: number; pending: number; cancelled: number }
  }>("/api/analytics")

  if (isLoading) {
    return <PageSkeleton />
  }

  const salesOverview = data?.salesOverview ?? []
  const topBatteryModels = data?.topBatteryModels ?? []
  const queryStats = data?.queryStats ?? []
  const orderCompletion = data?.orderCompletion ?? {
    completed: 0,
    pending: 0,
    cancelled: 0,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Sales performance, query throughput, and fulfillment quality."
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Sales overview</CardTitle>
            <CardDescription>Revenue and order volume for the last six months.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={salesConfig} className="h-72 w-full">
              <BarChart data={salesOverview} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Order completion rate</CardTitle>
            <CardDescription>Share of orders closed this month.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex items-end justify-between">
                <span className="text-3xl font-semibold">{orderCompletion.completed}%</span>
                <span className="text-xs text-muted-foreground">delivered on time</span>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                <span
                  className="bg-emerald-500"
                  style={{ width: `${orderCompletion.completed}%` }}
                />
                <span
                  className="bg-amber-400"
                  style={{ width: `${orderCompletion.pending}%` }}
                />
                <span
                  className="bg-red-400"
                  style={{ width: `${orderCompletion.cancelled}%` }}
                />
              </div>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Delivered
                </span>
                <span className="font-medium">{orderCompletion.completed}%</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-400" />
                  In progress
                </span>
                <span className="font-medium">{orderCompletion.pending}%</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-red-400" />
                  Cancelled
                </span>
                <span className="font-medium">{orderCompletion.cancelled}%</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Most sold battery models</CardTitle>
            <CardDescription>Units shipped year to date.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={modelConfig} className="h-72 w-full">
              <BarChart
                data={topBatteryModels}
                layout="vertical"
                accessibilityLayer
                margin={{ left: 16 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="model"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="units" fill="var(--color-units)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customer query statistics</CardTitle>
            <CardDescription>Distribution of AI processing outcomes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 md:flex-row">
            <ChartContainer config={queryConfig} className="h-64 w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={queryStats}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={58}
                  outerRadius={88}
                  strokeWidth={4}
                >
                  {queryStats.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="w-full space-y-2 text-sm">
              {queryStats.map((stat) => (
                <li key={stat.status} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: stat.fill }}
                    />
                    {stat.status}
                  </span>
                  <span className="font-medium">{stat.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

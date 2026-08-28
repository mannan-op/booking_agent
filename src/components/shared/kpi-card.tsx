import type { LucideIcon } from "lucide-react"
import { Minus, TrendingDown, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { KpiMetric } from "@/types"

type KpiCardProps = {
  metric: KpiMetric
  icon: LucideIcon
}

function TrendIndicator({ trend, change }: Pick<KpiMetric, "trend" | "change">) {
  switch (trend) {
    case "up":
      return (
        <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
          <TrendingUp className="size-3.5" />
          {change}
        </span>
      )
    case "down":
      return (
        <span className="inline-flex items-center gap-1 font-medium text-amber-700">
          <TrendingDown className="size-3.5" />
          {change}
        </span>
      )
    case "neutral":
      return (
        <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
          <Minus className="size-3.5" />
          {change}
        </span>
      )
    default: {
      const exhaustive: never = trend
      return exhaustive
    }
  }
}

export function KpiCard({ metric, icon: Icon }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {metric.label}
        </CardTitle>
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="font-heading text-3xl font-semibold tracking-tight">{metric.value}</p>
        <div className="flex items-center gap-2 text-xs">
          <TrendIndicator trend={metric.trend} change={metric.change} />
          <span className="text-muted-foreground">{metric.description}</span>
        </div>
      </CardContent>
    </Card>
  )
}

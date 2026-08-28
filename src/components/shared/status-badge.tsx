import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { OrderStatus, QueryStatus, StockAvailability } from "@/types"

type StatusKind = QueryStatus | OrderStatus | StockAvailability

const statusClassName: Record<StatusKind, string> = {
  Processing: "border-sky-200 bg-sky-50 text-sky-800",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "Human Review": "border-amber-200 bg-amber-50 text-amber-900",
  Pending: "border-border bg-muted text-muted-foreground",
  Confirmed: "border-primary/20 bg-primary/10 text-primary",
  Delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "In Stock": "border-emerald-200 bg-emerald-50 text-emerald-800",
  "Low Stock": "border-amber-200 bg-amber-50 text-amber-900",
  "Out of Stock": "border-red-200 bg-red-50 text-red-800",
}

function assertNever(value: never): never {
  throw new Error(`Unhandled status: ${String(value)}`)
}

function getStatusClassName(status: StatusKind) {
  switch (status) {
    case "Processing":
    case "Completed":
    case "Human Review":
    case "Pending":
    case "Confirmed":
    case "Delivered":
    case "In Stock":
    case "Low Stock":
    case "Out of Stock":
      return statusClassName[status]
    default:
      return assertNever(status)
  }
}

export function StatusBadge({ status }: { status: StatusKind }) {
  return (
    <Badge variant="outline" className={cn("font-medium", getStatusClassName(status))}>
      {status}
    </Badge>
  )
}

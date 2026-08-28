"use client"

import {
  Battery,
  ClipboardCheck,
  DollarSign,
  Inbox,
  MessageSquareText,
  ShoppingCart,
} from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { KpiCard } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { PageSkeleton } from "@/components/shared/table-skeleton"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useLiveData } from "@/hooks/use-live-data"
import { formatDate } from "@/lib/format"
import type { CustomerQuery, KpiMetric, Order } from "@/types"

const kpiIcons = {
  queries: MessageSquareText,
  reviews: ClipboardCheck,
  orders: ShoppingCart,
  stock: Battery,
  revenue: DollarSign,
} as const

export default function DashboardPage() {
  const { data, isLoading, error } = useLiveData<{
    kpis: KpiMetric[]
    recentQueries: CustomerQuery[]
    recentOrders: Order[]
  }>("/api/dashboard")

  if (isLoading) {
    return <PageSkeleton />
  }

  const kpiMetrics = data?.kpis ?? []
  const recentQueries = data?.recentQueries ?? []
  const recentOrders = data?.recentOrders ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations overview"
        description="Live snapshot of customer queries, fulfillment, and battery inventory."
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpiMetrics.map((metric) => (
          <KpiCard
            key={metric.id}
            metric={metric}
            icon={kpiIcons[metric.id as keyof typeof kpiIcons] ?? Inbox}
          />
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent customer queries</CardTitle>
          </CardHeader>
          <CardContent>
            {recentQueries.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No recent queries"
                description="New customer messages will appear here."
                className="py-10"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Laptop Model</TableHead>
                    <TableHead>Battery Requirement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentQueries.map((query) => (
                    <TableRow key={query.id}>
                      <TableCell className="font-medium">{query.customerName}</TableCell>
                      <TableCell>{query.laptopModel}</TableCell>
                      <TableCell>{query.batteryRequirement}</TableCell>
                      <TableCell>
                        <StatusBadge status={query.status} />
                      </TableCell>
                      <TableCell>{formatDate(query.date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="No orders yet"
                description="Confirmed chat orders will appear here."
                className="py-10"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Battery Model</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.batteryModel}</TableCell>
                      <TableCell>{order.branch}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Battery, Package, Search, Warehouse } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { StockCard } from "@/components/shared/stock-card"
import { TableSkeleton } from "@/components/shared/table-skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useLiveData } from "@/hooks/use-live-data"
import type { InventoryItem } from "@/types"

export default function InventoryPage() {
  const { data, isLoading, error } = useLiveData<{ inventory: InventoryItem[] }>(
    "/api/inventory",
  )
  const inventory = data?.inventory ?? []
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) {
      return inventory
    }

    return inventory.filter(
      (item) =>
        item.batteryModel.toLowerCase().includes(term) ||
        item.compatibleLaptop.toLowerCase().includes(term) ||
        item.branch.toLowerCase().includes(term)
    )
  }, [inventory, search])

  const totalUnits = inventory.reduce((sum, item) => sum + item.stockQuantity, 0)
  const lowStock = inventory.filter((item) => item.availability === "Low Stock").length
  const outOfStock = inventory.filter((item) => item.availability === "Out of Stock").length
  const skuCount = inventory.length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Inventory"
          description="Battery stock by model, compatible laptop, and branch."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <Card>
          <CardContent className="pt-4">
            <TableSkeleton columns={5} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Battery stock by model, compatible laptop, and branch."
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StockCard
          icon={Package}
          label="Tracked SKUs"
          value={String(skuCount)}
          hint="battery models in IMS"
        />
        <StockCard
          icon={Battery}
          label="Units on hand"
          value={totalUnits.toLocaleString()}
          hint="available across branches"
        />
        <StockCard
          icon={AlertTriangle}
          label="Low stock"
          value={String(lowStock)}
          hint="models below reorder point"
        />
        <StockCard
          icon={Warehouse}
          label="Out of stock"
          value={String(outOfStock)}
          hint="models requiring replenishment"
        />
      </section>
      <Card>
        <CardHeader className="gap-4">
          <CardTitle>Battery catalog</CardTitle>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search battery model, laptop, or branch"
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No matching batteries"
              description="Adjust the search to find a battery model or compatible laptop."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Battery Model</TableHead>
                  <TableHead>Compatible Laptop</TableHead>
                  <TableHead>Stock Quantity</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Availability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.batteryModel}</TableCell>
                    <TableCell>{item.compatibleLaptop}</TableCell>
                    <TableCell>{item.stockQuantity}</TableCell>
                    <TableCell>{item.branch}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.availability} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

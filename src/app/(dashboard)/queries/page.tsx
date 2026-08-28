"use client"

import { useMemo, useState } from "react"
import { Inbox, Search } from "lucide-react"

import { ConfidenceScore } from "@/components/shared/confidence-score"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { TableSkeleton } from "@/components/shared/table-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import type { CustomerQuery } from "@/types"

const statusFilters = ["All", "Processing", "Completed", "Human Review"] as const

type StatusFilter = (typeof statusFilters)[number]

export default function QueriesPage() {
  const { data, isLoading, error } = useLiveData<{ queries: CustomerQuery[] }>(
    "/api/queries",
  )
  const customerQueries = data?.queries ?? []
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("All")
  const [selected, setSelected] = useState<CustomerQuery | null>(null)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    return customerQueries.filter((query) => {
      const matchesStatus = status === "All" || query.status === status
      const matchesSearch =
        term.length === 0 ||
        query.customerName.toLowerCase().includes(term) ||
        query.message.toLowerCase().includes(term) ||
        query.laptopModel.toLowerCase().includes(term)

      return matchesStatus && matchesSearch
    })
  }, [customerQueries, search, status])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Customer queries"
          description="Incoming customer messages processed by the battery matching agent."
        />
        <Card>
          <CardContent className="pt-4">
            <TableSkeleton columns={6} rows={6} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer queries"
        description="Incoming customer messages processed by the battery matching agent."
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Card>
        <CardHeader className="gap-4">
          <CardTitle>Query inbox</CardTitle>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer, laptop, or message"
                className="pl-8"
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => {
                if (isStatusFilter(value)) {
                  setStatus(value)
                }
              }}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item === "All" ? "All statuses" : item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No queries found"
              description="Try a different search term or status filter."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="min-w-64">Message</TableHead>
                  <TableHead>Detected Laptop Model</TableHead>
                  <TableHead>AI Confidence Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((query) => (
                  <TableRow key={query.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{query.customerName}</span>
                        <span className="text-xs text-muted-foreground">
                          {query.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs whitespace-normal text-muted-foreground">
                      {query.message}
                    </TableCell>
                    <TableCell>{query.laptopModel}</TableCell>
                    <TableCell>
                      <ConfidenceScore value={query.confidence} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={query.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected(query)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.customerName}</DialogTitle>
                <DialogDescription>
                  {selected.id} · {formatDate(selected.date)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p className="rounded-lg bg-muted/60 p-3">{selected.message}</p>
                <p>
                  <span className="text-muted-foreground">Laptop: </span>
                  {selected.laptopModel}
                </p>
                <p>
                  <span className="text-muted-foreground">Battery: </span>
                  {selected.batteryRequirement}
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <StatusBadge status={selected.status} />
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function isStatusFilter(value: string | null): value is StatusFilter {
  return statusFilters.includes(value as StatusFilter)
}

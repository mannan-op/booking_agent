"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import { Check, ClipboardCheck, Pencil, X } from "lucide-react"
import { toast } from "sonner"

import { ConfidenceScore } from "@/components/shared/confidence-score"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useLiveData } from "@/hooks/use-live-data"
import type { ReviewRequest } from "@/types"

export default function HumanReviewPage() {
  const { data, isLoading, error, reload } = useLiveData<{ reviews: ReviewRequest[] }>(
    "/api/reviews",
  )
  const queue = data?.reviews ?? []
  const [editing, setEditing] = useState<ReviewRequest | null>(null)

  async function persist(id: string, action: "approve" | "reject" | "update", extracted?: ReviewRequest["extracted"]) {
    const response = await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, extracted }),
    })
    const body = (await response.json()) as { error?: string }
    if (!response.ok) {
      throw new Error(body.error || "Unable to update review")
    }
  }

  async function handleApprove(item: ReviewRequest) {
    try {
      await persist(item.id, "approve")
      toast.success(`Approved ${item.id} for ${item.customerName}`)
      await reload()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Approve failed")
    }
  }

  async function handleReject(item: ReviewRequest) {
    try {
      await persist(item.id, "reject")
      toast.error(`Rejected ${item.id}`)
      await reload()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Reject failed")
    }
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) {
      return
    }

    const form = new FormData(event.currentTarget)
    const extracted = {
      brand: String(form.get("brand") ?? editing.extracted.brand),
      laptopModel: String(form.get("laptopModel") ?? editing.extracted.laptopModel),
      batteryModel: String(form.get("batteryModel") ?? editing.extracted.batteryModel),
      specification: String(
        form.get("specification") ?? editing.extracted.specification
      ),
      quantity: Number(form.get("quantity") ?? editing.extracted.quantity),
    }

    try {
      await persist(editing.id, "update", extracted)
      setEditing(null)
      toast.success("Extracted information updated")
      await reload()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Save failed")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Human review"
          description="Verify low-confidence AI extractions before inventory matching."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Human review"
        description="Verify low-confidence AI extractions before inventory matching."
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {queue.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Review queue is clear"
          description="There are no pending verification requests right now."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {queue.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{item.customerName}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {item.id} · {item.receivedAt}
                    </p>
                  </div>
                  <ConfidenceScore value={item.confidence} className="max-w-36" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Customer message
                  </p>
                  <p className="rounded-lg bg-muted/60 p-3 text-sm">{item.message}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Extracted laptop information
                  </p>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Brand</dt>
                      <dd className="font-medium">{item.extracted.brand}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Laptop model</dt>
                      <dd className="font-medium">{item.extracted.laptopModel}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Battery model</dt>
                      <dd className="font-medium">{item.extracted.batteryModel}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Specification</dt>
                      <dd className="font-medium">{item.extracted.specification}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Quantity</dt>
                      <dd className="font-medium">{item.extracted.quantity}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">AI confidence</dt>
                      <dd className="font-medium">{item.confidence}%</dd>
                    </div>
                  </dl>
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(item)}>
                  <Pencil />
                  Edit information
                </Button>
                <Button variant="destructive" onClick={() => handleReject(item)}>
                  <X />
                  Reject
                </Button>
                <Button onClick={() => handleApprove(item)}>
                  <Check />
                  Approve
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          {editing ? (
            <form className="space-y-4" onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle>Edit extracted information</DialogTitle>
                <DialogDescription>
                  Correct the AI extraction before approving {editing.id}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" name="brand" defaultValue={editing.extracted.brand} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="laptopModel">Laptop model</Label>
                  <Input
                    id="laptopModel"
                    name="laptopModel"
                    defaultValue={editing.extracted.laptopModel}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batteryModel">Battery model</Label>
                  <Input
                    id="batteryModel"
                    name="batteryModel"
                    defaultValue={editing.extracted.batteryModel}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min={1}
                    defaultValue={editing.extracted.quantity}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="specification">Specification</Label>
                  <Input
                    id="specification"
                    name="specification"
                    defaultValue={editing.extracted.specification}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

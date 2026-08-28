import { NextResponse } from "next/server"

import { isDatabaseConfigured } from "@/lib/db"
import { updateReviewPayload, updateReviewStatus } from "@/lib/queries"

export const runtime = "nodejs"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    )
  }

  try {
    const { id } = await context.params
    const body = (await request.json()) as {
      action?: "approve" | "reject" | "update"
      extracted?: {
        brand: string
        laptopModel: string
        batteryModel: string
        specification: string
        quantity: number
      }
    }

    if (body.action === "approve" || body.action === "reject") {
      await updateReviewStatus(id, body.action === "approve" ? "approved" : "rejected")
      return NextResponse.json({ ok: true })
    }

    if (body.action === "update" && body.extracted) {
      await updateReviewPayload(id, body.extracted)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Unknown review action." }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update review." },
      { status: 500 },
    )
  }
}

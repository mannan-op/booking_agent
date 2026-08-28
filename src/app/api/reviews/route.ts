import { NextResponse } from "next/server"

import { isDatabaseConfigured } from "@/lib/db"
import { listReviews } from "@/lib/queries"

export const runtime = "nodejs"

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    )
  }

  try {
    const reviews = await listReviews()
    return NextResponse.json({ reviews })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load reviews." },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"

import { isDatabaseConfigured } from "@/lib/db"
import { listQueries } from "@/lib/queries"

export const runtime = "nodejs"

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    )
  }

  try {
    const queries = await listQueries()
    return NextResponse.json({ queries })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load queries." },
      { status: 500 },
    )
  }
}

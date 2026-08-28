import { NextResponse } from "next/server"

import { isDatabaseConfigured } from "@/lib/db"
import { listInventory } from "@/lib/queries"

export const runtime = "nodejs"

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    )
  }

  try {
    const inventory = await listInventory()
    return NextResponse.json({ inventory })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load inventory." },
      { status: 500 },
    )
  }
}

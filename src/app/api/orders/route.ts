import { NextResponse } from "next/server"

import { isDatabaseConfigured } from "@/lib/db"
import { listOrders } from "@/lib/queries"

export const runtime = "nodejs"

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    )
  }

  try {
    const orders = await listOrders()
    return NextResponse.json({ orders })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load orders." },
      { status: 500 },
    )
  }
}

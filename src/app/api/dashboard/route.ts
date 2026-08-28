import { NextResponse } from "next/server"

import { isDatabaseConfigured } from "@/lib/db"
import { listKpis, listOrders, listQueries } from "@/lib/queries"

export const runtime = "nodejs"

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    )
  }

  try {
    const [kpis, queries, orders] = await Promise.all([
      listKpis(),
      listQueries(),
      listOrders(),
    ])

    return NextResponse.json({
      kpis,
      recentQueries: queries.slice(0, 6),
      recentOrders: orders.slice(0, 6),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load dashboard." },
      { status: 500 },
    )
  }
}

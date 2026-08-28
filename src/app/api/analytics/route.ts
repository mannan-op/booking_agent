import { NextResponse } from "next/server"

import { isDatabaseConfigured } from "@/lib/db"
import { listQueryStats, listSalesOverview, listTopModels } from "@/lib/queries"

export const runtime = "nodejs"

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    )
  }

  try {
    const [salesOverview, topBatteryModels, queryStats] = await Promise.all([
      listSalesOverview(),
      listTopModels(),
      listQueryStats(),
    ])

    const delivered = queryStats.find((item) => item.status === "Completed")?.count ?? 0
    const processing = queryStats.find((item) => item.status === "Processing")?.count ?? 0
    const review = queryStats.find((item) => item.status === "Human Review")?.count ?? 0
    const total = delivered + processing + review || 1

    return NextResponse.json({
      salesOverview,
      topBatteryModels,
      queryStats,
      orderCompletion: {
        completed: Math.round((delivered / total) * 100),
        pending: Math.round((processing / total) * 100),
        cancelled: Math.round((review / total) * 100),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load analytics." },
      { status: 500 },
    )
  }
}

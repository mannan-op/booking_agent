import { NextResponse } from "next/server"

import { n8nErrorMessage, sendToN8nIntake, type N8nIntakePayload } from "@/lib/n8n"

export const runtime = "nodejs"
export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as N8nIntakePayload
    const result = await sendToN8nIntake(payload)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, details: result.body },
        { status: result.status },
      )
    }
    return NextResponse.json(result.body)
  } catch {
    return NextResponse.json(
      { error: n8nErrorMessage(null, "Unable to reach the n8n webhook.") },
      { status: 502 },
    )
  }
}

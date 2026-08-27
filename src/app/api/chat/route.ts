import { NextResponse } from "next/server"

const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL

export async function POST(request: Request) {
  if (!n8nWebhookUrl) {
    return NextResponse.json(
      { error: "N8N_WEBHOOK_URL is not configured." },
      { status: 503 },
    )
  }

  try {
    const payload = await request.json()
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const text = await response.text()
    let body: unknown = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = { reply: text }
    }

    return NextResponse.json(body, { status: response.status })
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the n8n webhook." },
      { status: 502 },
    )
  }
}
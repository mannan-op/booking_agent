export type N8nIntakePayload = {
  conversation_id: string
  channel: string
  from: string
  message_id: string
  text: string
  image_url: string
  content_type: "text" | "image"
}

export type N8nIntakeResult =
  | { ok: true; body: unknown; reply: string }
  | { ok: false; status: number; error: string; body: unknown }

const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL

const replyKeys = ["reply", "message", "response", "output", "text", "raw_text", "body"] as const

function isUsableReply(value: string) {
  const text = value.trim()
  if (text.length < 8) {
    return false
  }
  switch (text.toLowerCase()) {
    case "success":
    case "error":
    case "pending":
    case "found":
    case "checking":
    case "whatsapp":
    case "text":
    case "image":
      return false
    default:
      return true
  }
}

export function extractReplyText(value: unknown, depth = 0): string {
  if (depth > 6) {
    return ""
  }
  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim()
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return extractReplyText(JSON.parse(trimmed), depth + 1)
      } catch {
        return isUsableReply(trimmed) ? trimmed : ""
      }
    }
    return isUsableReply(trimmed) ? trimmed : ""
  }
  if (Array.isArray(value) && value.length > 0) {
    for (const item of value) {
      const nested = extractReplyText(item, depth + 1)
      if (nested) {
        return nested
      }
    }
    return ""
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    for (const key of replyKeys) {
      if (typeof record[key] === "string" && isUsableReply(record[key])) {
        return record[key].trim()
      }
    }
    for (const key of ["details", "json", "data"]) {
      if (record[key] != null) {
        const nested = extractReplyText(record[key], depth + 1)
        if (nested) {
          return nested
        }
      }
    }
  }
  return ""
}

export function n8nErrorMessage(value: unknown, fallback = "The workflow returned an error.") {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    for (const key of ["error", "message"]) {
      if (typeof record[key] === "string" && record[key].trim()) {
        return record[key].trim()
      }
    }
  }
  return fallback
}

export async function sendToN8nIntake(payload: N8nIntakePayload): Promise<N8nIntakeResult> {
  if (!n8nWebhookUrl) {
    return {
      ok: false,
      status: 503,
      error: "N8N_WEBHOOK_URL is not configured.",
      body: null,
    }
  }

  try {
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

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: n8nErrorMessage(body),
        body,
      }
    }

    const reply = extractReplyText(body)
    if (!reply) {
      console.info("n8n intake returned no customer reply", {
        status: response.status,
        body,
      })
    }
    return {
      ok: true,
      body,
      reply,
    }
  } catch {
    return {
      ok: false,
      status: 502,
      error: "Unable to reach the n8n webhook.",
      body: null,
    }
  }
}

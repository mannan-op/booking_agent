import { NextResponse } from "next/server"

import { sendToN8nIntake } from "@/lib/n8n"
import {
  conversationIdForPhone,
  getWhatsAppConfig,
  isWaapiPayload,
  parseWhatsAppInbound,
  resolveMetaMediaUrl,
  sendWhatsAppText,
  syncWaapiWebhook,
  verifyWaapiWebhookToken,
  verifyWhatsAppSignature,
} from "@/lib/whatsapp"

export const runtime = "nodejs"
export const maxDuration = 120

const customerFallback =
  "Sorry — our battery desk is temporarily unavailable. Please try again in a moment."

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}

export async function GET(request: Request) {
  const config = getWhatsAppConfig()
  const url = new URL(request.url)
  const mode = url.searchParams.get("hub.mode")
  const token = url.searchParams.get("hub.verify_token")
  const challenge = url.searchParams.get("hub.challenge")

  if (mode === "subscribe" && token && challenge && token === config.verifyToken) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    })
  }

  // WaAPI (and ngrok) health-check with GET. A 403 makes them stop delivering messages.
  void syncWaapiWebhook().catch((error) => {
    console.error("WaAPI webhook sync failed", error)
  })
  return NextResponse.json({ status: "ok" })
}

export async function POST(request: Request) {
  const config = getWhatsAppConfig()
  const rawBody = await request.text()

  let payload: unknown = null
  try {
    payload = rawBody ? JSON.parse(rawBody) : null
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }

  if (isWaapiPayload(payload)) {
    if (!verifyWaapiWebhookToken(request, config.waapiWebhookSecret)) {
      return NextResponse.json({ error: "Invalid WaAPI webhook token." }, { status: 401 })
    }
  } else {
    const signature = request.headers.get("x-hub-signature-256")
    if (!verifyWhatsAppSignature(rawBody, signature, config.appSecret)) {
      return NextResponse.json({ error: "Invalid WhatsApp signature." }, { status: 401 })
    }
  }

  const inbound = parseWhatsAppInbound(payload)
  if (isWaapiPayload(payload)) {
    const root = payload as Record<string, unknown>
    const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null
    const message =
      data?.message && typeof data.message === "object"
        ? (data.message as Record<string, unknown>)
        : null
    console.info("WaAPI webhook", {
      event: root.event,
      inbound: inbound.length,
      fromMe: message?.fromMe ?? null,
      from: message?.from ?? null,
      to: message?.to ?? null,
      type: message?.type ?? null,
    })
  }
  try {
    await processInbound(inbound)
  } catch (error) {
    console.error("WhatsApp inbound failed", error)
  }
  return NextResponse.json({ status: "ok" })
}

const processedMessageIds = new Map<string, number>()
const processedFingerprints = new Map<string, number>()
const processedTtlMs = 10 * 60 * 1000
const fingerprintTtlMs = 20 * 1000

function pruneSeen(map: Map<string, number>, now: number, ttlMs: number) {
  for (const [id, seenAt] of map) {
    if (now - seenAt > ttlMs) {
      map.delete(id)
    }
  }
}

function takeInboundOnce(messageId: string, fingerprint: string) {
  const now = Date.now()
  pruneSeen(processedMessageIds, now, processedTtlMs)
  pruneSeen(processedFingerprints, now, fingerprintTtlMs)
  if (processedMessageIds.has(messageId) || processedFingerprints.has(fingerprint)) {
    return false
  }
  processedMessageIds.set(messageId, now)
  processedFingerprints.set(fingerprint, now)
  return true
}

async function processInbound(
  inbound: ReturnType<typeof parseWhatsAppInbound>,
) {
  for (const message of inbound) {
    const fingerprint = `${message.from}:${message.text.trim().toLowerCase()}`
    if (!takeInboundOnce(message.messageId, fingerprint)) {
      continue
    }
    let imageUrl = message.imageUrl
    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = await resolveMetaMediaUrl(imageUrl)
    }
    const result = await sendToN8nIntake({
      conversation_id: conversationIdForPhone(message.from),
      channel: "whatsapp",
      from: message.from,
      message_id: message.messageId,
      text: message.text,
      image_url: imageUrl,
      content_type: message.contentType,
    })

    if (!result.ok) {
      console.error("n8n intake failed", result.status, result.error)
    }

    const reply = result.ok
      ? result.reply || "We received your message and are checking battery stock."
      : customerFallback
    const config = getWhatsAppConfig()
    if (!config.sendConfigured) {
      console.error("WhatsApp reply skipped: no send provider configured (set WAAPI_* or WHATSAPP_*).")
      continue
    }
    try {
      await sendWhatsAppText(message.from, reply, message.messageId)
    } catch (error) {
      console.error(
        "WhatsApp reply failed:",
        error instanceof Error ? error.message : error,
      )
    }
  }
}

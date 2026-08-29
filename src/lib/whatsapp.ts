import { createHash, createHmac, timingSafeEqual } from "node:crypto"

export type WhatsAppInboundMessage = {
  from: string
  messageId: string
  text: string
  imageUrl: string
  contentType: "text" | "image"
}

export function getWhatsAppConfig() {
  const waapiToken = process.env.WAAPI_TOKEN?.trim() || ""
  const waapiInstanceId = process.env.WAAPI_INSTANCE_ID?.trim() || ""
  const waapiWebhookSecret = process.env.WAAPI_WEBHOOK_SECRET?.trim() || ""
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim() || ""
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim() || ""
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || ""
  const appSecret = process.env.WHATSAPP_APP_SECRET?.trim() || ""
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION?.trim() || "v21.0"
  const publicAppUrl = (process.env.PUBLIC_APP_URL || process.env.WHATSAPP_PUBLIC_URL || "")
    .trim()
    .replace(/\/$/, "")
  const waapiConfigured = Boolean(waapiToken && waapiInstanceId)
  const metaSendConfigured = Boolean(accessToken && phoneNumberId)

  const metaReceiveConfigured =
    (Boolean(verifyToken) && Boolean(appSecret)) || metaSendConfigured

  return {
    provider: waapiConfigured ? ("waapi" as const) : metaSendConfigured ? ("meta" as const) : ("none" as const),
    waapiToken,
    waapiInstanceId,
    waapiWebhookSecret,
    verifyToken,
    accessToken,
    phoneNumberId,
    appSecret,
    graphVersion,
    publicAppUrl,
    receiveConfigured: waapiConfigured || metaReceiveConfigured,
    sendConfigured: waapiConfigured || metaSendConfigured,
    webhookPath: "/api/whatsapp/webhook",
    webhookUrl: publicAppUrl ? `${publicAppUrl}/api/whatsapp/webhook` : "",
  }
}

let lastWaapiWebhookSync = 0
let lastWaapiWebhookEvents = ""
const waapiWebhookEvents = ["message"]

export async function syncWaapiWebhook() {
  const config = getWhatsAppConfig()
  if (config.provider !== "waapi" || !config.webhookUrl) {
    return
  }
  const now = Date.now()
  const eventsKey = waapiWebhookEvents.join(",")
  if (now - lastWaapiWebhookSync < 30_000 && lastWaapiWebhookEvents === eventsKey) {
    return
  }
  lastWaapiWebhookSync = now
  lastWaapiWebhookEvents = eventsKey

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${config.waapiToken}`,
    "Content-Type": "application/json",
  }
  const webhook = {
    url: config.webhookUrl,
    events: waapiWebhookEvents,
  }

  const update = await fetch(`https://waapi.app/api/v1/instances/${config.waapiInstanceId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ webhook }),
  })
  if (update.ok) {
    console.info("WaAPI webhook synced", config.webhookUrl)
    return
  }

  const fallback = await fetch(
    `https://waapi.app/api/v1/instances/${config.waapiInstanceId}/webhook`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(webhook),
    },
  )
  if (!fallback.ok) {
    const errorBody = await fallback.text()
    console.error("WaAPI webhook sync failed", errorBody || fallback.status)
    lastWaapiWebhookSync = 0
    return
  }
  console.info("WaAPI webhook synced", config.webhookUrl)
}

export function conversationIdForPhone(phone: string) {
  const hash = createHash("sha1").update(`voltops-whatsapp:${phone}`).digest()
  const bytes = Buffer.from(hash.subarray(0, 16))
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

export function isWaapiPayload(payload: unknown) {
  const root = asRecord(payload)
  if (!root) {
    return false
  }
  if (typeof root.event === "string" && (root.instanceId != null || root.instance_id != null)) {
    return true
  }
  return Boolean(asRecord(root.data)?.message || root.message)
}

export function verifyWhatsAppSignature(rawBody: string, signatureHeader: string | null, appSecret: string) {
  if (!appSecret) {
    return true
  }
  if (!signatureHeader?.startsWith("sha256=")) {
    return false
  }
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex")
  const given = signatureHeader.slice("sha256=".length)
  const expectedBuffer = Buffer.from(expected, "utf8")
  const givenBuffer = Buffer.from(given, "utf8")
  if (expectedBuffer.length !== givenBuffer.length) {
    return false
  }
  return timingSafeEqual(expectedBuffer, givenBuffer)
}

export function verifyWaapiWebhookToken(request: Request, secret: string) {
  if (!secret) {
    return true
  }
  const url = new URL(request.url)
  const provided =
    url.searchParams.get("token")?.trim() ||
    request.headers.get("x-webhook-token")?.trim() ||
    bearerToken(request.headers.get("authorization"))
  // WaAPI pings GET/POST without the query token even when the dashboard URL has ?token=
  if (!provided) {
    return true
  }
  return secretEqual(provided, secret)
}

export function parseWhatsAppInbound(payload: unknown): WhatsAppInboundMessage[] {
  if (isWaapiPayload(payload)) {
    return parseWaapiInbound(payload)
  }
  return parseMetaInbound(payload)
}

function parseWaapiInbound(payload: unknown): WhatsAppInboundMessage[] {
  const root = asRecord(payload)
  const event = typeof root?.event === "string" ? root.event.toLowerCase() : ""
  if (!root) {
    return []
  }
  if (event && event !== "message") {
    return []
  }

  const data = asRecord(root.data)
  const message =
    asRecord(data?.message) ||
    asRecord(root.message) ||
    (data && (data.body != null || data.from != null) ? data : null)
  if (!message) {
    return []
  }

  const fromMe = message.fromMe === true || asRecord(message.id)?.fromMe === true
  if (fromMe || message.isStatus === true) {
    return []
  }

  const fromJid = jidFromValue(message.from) || jidFromValue(asRecord(message.id)?.remote)
  const remoteJid = jidFromValue(asRecord(message.id)?.remote) || fromJid
  if (!fromJid || isGroupOrStatusJid(fromJid) || isGroupOrStatusJid(remoteJid)) {
    return []
  }

  const from = phoneFromJid(fromJid)
  const messageId =
    (typeof asRecord(message.id)?._serialized === "string" && String(asRecord(message.id)?._serialized)) ||
    (typeof asRecord(message.id)?.id === "string" && String(asRecord(message.id)?.id)) ||
    `${from}-${typeof message.timestamp === "number" ? message.timestamp : Date.now()}`
  if (!from) {
    return []
  }

  const type = typeof message.type === "string" ? message.type : "chat"
  const body = typeof message.body === "string" ? message.body.trim() : ""

  if (type === "image") {
    return [
      {
        from,
        messageId: String(messageId),
        text: body,
        imageUrl: "",
        contentType: body ? "text" : "image",
      },
    ]
  }

  if (!body) {
    return []
  }

  return [
    {
      from,
      messageId: String(messageId),
      text: body,
      imageUrl: "",
      contentType: "text",
    },
  ]
}

function parseMetaInbound(payload: unknown): WhatsAppInboundMessage[] {
  const root = asRecord(payload)
  if (!root || root.object !== "whatsapp_business_account" || !Array.isArray(root.entry)) {
    return []
  }

  const inbound: WhatsAppInboundMessage[] = []

  for (const entry of root.entry) {
    const entryRecord = asRecord(entry)
    const changes = Array.isArray(entryRecord?.changes) ? entryRecord.changes : []
    for (const change of changes) {
      const changeRecord = asRecord(change)
      const value = asRecord(changeRecord?.value)
      const messages = Array.isArray(value?.messages) ? value.messages : []
      for (const item of messages) {
        const parsed = parseMetaMessage(item)
        if (parsed) {
          inbound.push(parsed)
        }
      }
    }
  }

  return inbound
}

function parseMetaMessage(item: unknown): WhatsAppInboundMessage | null {
  const message = asRecord(item)
  if (!message) {
    return null
  }
  const from = typeof message.from === "string" ? message.from : ""
  const messageId = typeof message.id === "string" ? message.id : ""
  if (!from || !messageId) {
    return null
  }

  const type = typeof message.type === "string" ? message.type : "text"
  if (type === "text") {
    const text = asRecord(message.text)
    const body = typeof text?.body === "string" ? text.body.trim() : ""
    if (!body) {
      return null
    }
    return {
      from,
      messageId,
      text: body,
      imageUrl: "",
      contentType: "text",
    }
  }

  if (type === "image") {
    const image = asRecord(message.image)
    const caption = typeof image?.caption === "string" ? image.caption.trim() : ""
    const mediaId = typeof image?.id === "string" ? image.id : ""
    return {
      from,
      messageId,
      text: caption,
      imageUrl: mediaId,
      contentType: caption ? "text" : "image",
    }
  }

  return null
}

export async function sendWhatsAppText(to: string, body: string, replyToMessageId?: string) {
  const config = getWhatsAppConfig()
  const chunks = splitWhatsAppText(body)

  if (config.provider === "waapi") {
    for (const [index, chunk] of chunks.entries()) {
      await sendWaapiText(to, chunk, index === 0 ? replyToMessageId : undefined)
    }
    return
  }

  if (config.provider === "meta") {
    for (const [index, chunk] of chunks.entries()) {
      await sendMetaText(to, chunk, index === 0 ? replyToMessageId : undefined)
    }
    return
  }

  throw new Error("WhatsApp is not configured. Set WAAPI_TOKEN and WAAPI_INSTANCE_ID.")
}

async function sendWaapiText(to: string, message: string, replyToMessageId?: string) {
  const result = await postWaapiMessage(to, message, replyToMessageId)
  if (result.ok) {
    return
  }

  const allowed = result.error.match(/only able to send actions to ([0-9]+@c\.us)/i)
  const current = chatIdFromPhone(to)
  if (allowed?.[1] && allowed[1] !== current) {
    const retry = await postWaapiMessage(allowed[1], message, replyToMessageId)
    if (retry.ok) {
      return
    }
    throw new Error(retry.error)
  }

  throw new Error(result.error)
}

async function postWaapiMessage(to: string, message: string, replyToMessageId?: string) {
  const config = getWhatsAppConfig()
  const payload: Record<string, unknown> = {
    chatId: chatIdFromPhone(to),
    message,
    previewLink: false,
  }
  if (replyToMessageId) {
    payload.replyToMessageId = replyToMessageId
  }
  const response = await fetch(
    `https://waapi.app/api/v1/instances/${config.waapiInstanceId}/client/action/send-message`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.waapiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  )
  if (response.ok) {
    return { ok: true as const }
  }
  const errorBody = await response.text()
  return { ok: false as const, error: waapiErrorMessage(errorBody, response.status) }
}

export async function resolveMetaMediaUrl(mediaId: string): Promise<string> {
  const config = getWhatsAppConfig()
  if (!mediaId) {
    return ""
  }
  if (mediaId.startsWith("http://") || mediaId.startsWith("https://")) {
    return mediaId
  }
  if (config.provider !== "meta") {
    return mediaId
  }
  try {
    const response = await fetch(
      `https://graph.facebook.com/${config.graphVersion}/${mediaId}`,
      { headers: { Authorization: `Bearer ${config.accessToken}` } },
    )
    if (!response.ok) {
      console.error("Meta media resolve failed", response.status)
      return ""
    }
    const data = (await response.json()) as { url?: string }
    return data.url ?? ""
  } catch (error) {
    console.error(
      "Meta media resolve error",
      error instanceof Error ? error.message : error,
    )
    return ""
  }
}

async function sendMetaText(to: string, body: string, replyToMessageId?: string) {
  const config = getWhatsAppConfig()
  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { preview_url: false, body },
  }
  if (replyToMessageId) {
    payload.context = { message_id: replyToMessageId }
  }
  const response = await fetch(
    `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  )
  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || `WhatsApp send failed (${response.status})`)
  }
}

function waapiErrorMessage(errorBody: string, status: number) {
  try {
    const parsed = JSON.parse(errorBody) as { message?: unknown }
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message.trim()
    }
  } catch {
    // not JSON
  }
  return errorBody || `WaAPI send failed (${status})`
}

function splitWhatsAppText(value: string) {
  const text = value.trim() || "Sorry, I could not build a reply just then. Please try again."
  const limit = 4000
  if (text.length <= limit) {
    return [text]
  }
  const chunks: string[] = []
  let remaining = text
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, limit))
    remaining = remaining.slice(limit)
  }
  return chunks
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function bearerToken(header: string | null) {
  if (!header?.toLowerCase().startsWith("bearer ")) {
    return ""
  }
  return header.slice("bearer ".length).trim()
}

function secretEqual(provided: string, expected: string) {
  const left = createHash("sha256").update(provided).digest()
  const right = createHash("sha256").update(expected).digest()
  return timingSafeEqual(left, right)
}

function jidFromValue(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value.trim()
  }
  const record = asRecord(value)
  if (!record) {
    return ""
  }
  if (typeof record._serialized === "string" && record._serialized.trim()) {
    return record._serialized.trim()
  }
  if (typeof record.user === "string" && record.user.trim()) {
    const server = typeof record.server === "string" && record.server.trim() ? record.server.trim() : "c.us"
    return `${record.user.trim()}@${server}`
  }
  return ""
}

function phoneFromJid(jid: string) {
  let digits = jid.replace(/@.*$/, "").replace(/\D/g, "")
  if (digits.startsWith("00")) {
    digits = digits.slice(2)
  }
  if (digits.startsWith("0") && digits.length >= 10) {
    digits = `92${digits.slice(1)}`
  }
  return digits
}

function chatIdFromPhone(phone: string) {
  if (phone.includes("@")) {
    return phone
  }
  return `${phone.replace(/\D/g, "")}@c.us`
}

function isGroupOrStatusJid(jid: string) {
  return jid.endsWith("@g.us") || jid.endsWith("@broadcast") || jid.startsWith("status@")
}

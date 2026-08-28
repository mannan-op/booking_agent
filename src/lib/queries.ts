import { query } from "@/lib/db"
import type {
  BatterySalesShare,
  CustomerQuery,
  InventoryItem,
  KpiMetric,
  Order,
  OrderStatus,
  QueryStat,
  QueryStatus,
  ReviewRequest,
  SalesPoint,
  StockAvailability,
} from "@/types"

function toQueryStatus(value: string | null | undefined, hasReview: boolean): QueryStatus {
  if (hasReview) {
    return "Human Review"
  }
  const normalized = (value ?? "").trim().toLowerCase()
  if (normalized === "resolved" || normalized === "completed") {
    return "Completed"
  }
  if (normalized === "escalated" || normalized === "human review") {
    return "Human Review"
  }
  return "Processing"
}

function toOrderStatus(value: string | null | undefined): OrderStatus {
  switch ((value ?? "").trim().toLowerCase()) {
    case "confirmed":
      return "Confirmed"
    case "processing":
      return "Processing"
    case "delivered":
    case "fulfilled":
      return "Delivered"
    case "pending":
      return "Pending"
    default:
      return "Pending"
  }
}

function availability(quantity: number): StockAvailability {
  if (quantity <= 0) {
    return "Out of Stock"
  }
  if (quantity < 5) {
    return "Low Stock"
  }
  return "In Stock"
}

function asString(value: unknown, fallback = "—") {
  if (typeof value === "string" && value.trim().length > 0) {
    return value
  }
  if (typeof value === "number") {
    return String(value)
  }
  return fallback
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parsePayload(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return {}
    }
  }
  return {}
}

type QueryRow = {
  conversation_id: string
  customer_phone: string | null
  channel: string | null
  status: string
  created_at: Date | string
  raw_text: string | null
  confidence: string | number | null
  review_status: string | null
}

export async function listQueries(): Promise<CustomerQuery[]> {
  const rows = await query<QueryRow>(
    `SELECT
       c.conversation_id,
       c.customer_phone,
       c.channel,
       c.status,
       c.created_at,
       m.raw_text,
       m.confidence,
       r.status AS review_status
     FROM conversations c
     LEFT JOIN LATERAL (
       SELECT raw_text, confidence
       FROM messages
       WHERE conversation_id = c.conversation_id
         AND direction = 'inbound'
       ORDER BY created_at DESC
       LIMIT 1
     ) m ON TRUE
     LEFT JOIN LATERAL (
       SELECT status
       FROM human_review_tasks
       WHERE conversation_id = c.conversation_id
         AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1
     ) r ON TRUE
     ORDER BY c.created_at DESC
     LIMIT 200`,
  )

  return rows.map((row) => {
    const created = new Date(row.created_at)

    return {
      id: row.conversation_id.slice(0, 8).toUpperCase(),
      customerName:
        row.channel === "whatsapp"
          ? `WhatsApp ${row.customer_phone || "customer"}`
          : row.customer_phone || "Web customer",
      email: row.customer_phone || row.channel || "web_demo",
      message: row.raw_text || "—",
      laptopModel: "—",
      batteryRequirement: "—",
      confidence: Math.round(asNumber(row.confidence) * (asNumber(row.confidence) <= 1 ? 100 : 1)),
      status: toQueryStatus(row.status, Boolean(row.review_status)),
      date: created.toISOString().slice(0, 10),
    }
  })
}

type OrderRow = {
  id: number
  conversation_id: string | null
  product_id: string
  model: string | null
  branch_id: string | null
  branch_name: string | null
  quantity: number
  price: string | number | null
  status: string
  created_at: Date | string
  customer_phone: string | null
}

export async function listOrders(): Promise<Order[]> {
  const rows = await query<OrderRow>(
    `SELECT
       o.id,
       o.conversation_id,
       o.product_id,
       o.model,
       o.branch_id,
       b.branch_name,
       o.quantity,
       o.price,
       o.status,
       o.created_at,
       c.customer_phone
     FROM orders o
     LEFT JOIN branches b ON b.branch_id = o.branch_id
     LEFT JOIN conversations c ON c.conversation_id = o.conversation_id
     ORDER BY o.created_at DESC
     LIMIT 200`,
  )

  return rows.map((row) => ({
    id: `ORD-${row.id}`,
    customerName: row.customer_phone || "Web customer",
    batteryModel: row.model || row.product_id,
    quantity: row.quantity,
    price: asNumber(row.price),
    branch: row.branch_name || row.branch_id || "Unassigned",
    status: toOrderStatus(row.status),
    date: new Date(row.created_at).toISOString().slice(0, 10),
  }))
}

type InventoryRow = {
  product_id: string
  model: string
  laptop_model_hint: string | null
  quantity: number
  branch_name: string
  unit_price: string | number | null
}

export async function listInventory(): Promise<InventoryItem[]> {
  const rows = await query<InventoryRow>(
    `SELECT
       p.product_id,
       p.model,
       p.laptop_model_hint,
       s.quantity,
       b.branch_name,
       avg_sales.unit_price
     FROM stock s
     JOIN products p ON p.product_id = s.product_id
     JOIN branches b ON b.branch_id = s.branch_id
     LEFT JOIN LATERAL (
       SELECT AVG(sale_price) AS unit_price
       FROM sales
       WHERE product_id = p.product_id
     ) avg_sales ON TRUE
     WHERE p.status = 'active'
     ORDER BY p.model, b.branch_name`,
  )

  return rows.map((row) => ({
    id: `${row.product_id}-${row.branch_name}`,
    batteryModel: row.model,
    compatibleLaptop: row.laptop_model_hint || "—",
    stockQuantity: row.quantity,
    branch: row.branch_name,
    availability: availability(row.quantity),
    unitPrice: Math.round(asNumber(row.unit_price)),
  }))
}

type ReviewRow = {
  id: number
  conversation_id: string | null
  reason_code: string
  payload: unknown
  status: string
  created_at: Date | string
  customer_phone: string | null
  raw_text: string | null
  confidence: string | number | null
}

export async function listReviews(): Promise<ReviewRequest[]> {
  const rows = await query<ReviewRow>(
    `SELECT
       t.id,
       t.conversation_id,
       t.reason_code,
       t.payload,
       t.status,
       t.created_at,
       c.customer_phone,
       m.raw_text,
       m.confidence
     FROM human_review_tasks t
     LEFT JOIN conversations c ON c.conversation_id = t.conversation_id
     LEFT JOIN LATERAL (
       SELECT raw_text, confidence
       FROM messages
       WHERE conversation_id = t.conversation_id
         AND direction = 'inbound'
       ORDER BY created_at DESC
       LIMIT 1
     ) m ON TRUE
     WHERE t.status = 'pending'
     ORDER BY t.created_at DESC
     LIMIT 100`,
  )

  return rows.map((row) => {
    const payload = parsePayload(row.payload)
    const extractedSource = parsePayload(payload.extracted ?? payload)
    const created = new Date(row.created_at)

    return {
      id: `RV-${row.id}`,
      customerName: asString(payload.from ?? row.customer_phone, "Web customer"),
      email: asString(payload.from ?? row.customer_phone, "web_demo"),
      message: asString(payload.text ?? row.raw_text, row.reason_code),
      extracted: {
        brand: asString(extractedSource.brand, "—"),
        laptopModel: asString(extractedSource.laptop_model ?? extractedSource.laptopModel, "—"),
        batteryModel: asString(
          extractedSource.battery_model ?? extractedSource.model ?? extractedSource.batteryModel,
          "—",
        ),
        specification: asString(extractedSource.specification ?? row.reason_code, "—"),
        quantity: asNumber(extractedSource.quantity, 1),
      },
      confidence: Math.round(
        asNumber(extractedSource.confidence ?? row.confidence) *
          (asNumber(extractedSource.confidence ?? row.confidence) <= 1 ? 100 : 1),
      ),
      receivedAt: created.toISOString().replace("T", " ").slice(0, 16),
    }
  })
}

export async function updateReviewStatus(id: string, status: "approved" | "rejected") {
  const numericId = Number(id.replace(/^RV-/i, ""))
  if (!Number.isFinite(numericId)) {
    throw new Error("Invalid review id")
  }

  await query(
    `UPDATE human_review_tasks
     SET status = $2
     WHERE id = $1`,
    [numericId, status],
  )
}

export async function updateReviewPayload(
  id: string,
  extracted: ReviewRequest["extracted"],
) {
  const numericId = Number(id.replace(/^RV-/i, ""))
  if (!Number.isFinite(numericId)) {
    throw new Error("Invalid review id")
  }

  await query(
    `UPDATE human_review_tasks
     SET payload = COALESCE(payload, '{}'::jsonb) || jsonb_build_object('extracted', $2::jsonb)
     WHERE id = $1`,
    [numericId, JSON.stringify(extracted)],
  )
}

export async function listKpis(): Promise<KpiMetric[]> {
  const [totals] = await query<{
    queries: string | number
    reviews: string | number
    orders_today: string | number
    stock: string | number
    revenue: string | number
  }>(
    `SELECT
       (SELECT COUNT(*) FROM conversations) AS queries,
       (SELECT COUNT(*) FROM human_review_tasks WHERE status = 'pending') AS reviews,
       (SELECT COUNT(*) FROM orders WHERE created_at::date = CURRENT_DATE) AS orders_today,
       (SELECT COALESCE(SUM(quantity), 0) FROM stock) AS stock,
       (SELECT COALESCE(SUM(sale_price * qty), 0) FROM sales) AS revenue`,
  )

  return [
    {
      id: "queries",
      label: "Total Customer Queries",
      value: Number(totals?.queries ?? 0).toLocaleString(),
      change: "live",
      trend: "neutral",
      description: "conversations in Postgres",
    },
    {
      id: "reviews",
      label: "Pending Human Reviews",
      value: Number(totals?.reviews ?? 0).toLocaleString(),
      change: "queue",
      trend: "neutral",
      description: "tasks awaiting verification",
    },
    {
      id: "orders",
      label: "Orders Today",
      value: Number(totals?.orders_today ?? 0).toLocaleString(),
      change: "today",
      trend: "up",
      description: "created by n8n Workflow 8",
    },
    {
      id: "stock",
      label: "Available Battery Stock",
      value: Number(totals?.stock ?? 0).toLocaleString(),
      change: "IMS",
      trend: "neutral",
      description: "units across all branches",
    },
    {
      id: "revenue",
      label: "Revenue Generated",
      value: `Rs ${Math.round(Number(totals?.revenue ?? 0)).toLocaleString()}`,
      change: "90d",
      trend: "up",
      description: "from seeded IMS sales history",
    },
  ]
}

export async function listSalesOverview(): Promise<SalesPoint[]> {
  const rows = await query<{ month: string; revenue: string | number; orders: string | number }>(
    `SELECT
       to_char(date_trunc('month', sale_date), 'Mon') AS month,
       SUM(sale_price * qty) AS revenue,
       COUNT(*) AS orders
     FROM sales
     GROUP BY date_trunc('month', sale_date)
     ORDER BY date_trunc('month', sale_date)`,
  )

  return rows.map((row) => ({
    month: row.month,
    revenue: Math.round(asNumber(row.revenue)),
    orders: asNumber(row.orders),
  }))
}

export async function listTopModels(): Promise<BatterySalesShare[]> {
  const rows = await query<{ model: string; units: string | number }>(
    `SELECT p.model, SUM(s.qty) AS units
     FROM sales s
     JOIN products p ON p.product_id = s.product_id
     GROUP BY p.model
     ORDER BY units DESC
     LIMIT 8`,
  )

  return rows.map((row) => ({
    model: row.model,
    units: asNumber(row.units),
  }))
}

export async function listQueryStats(): Promise<QueryStat[]> {
  const [row] = await query<{
    completed: string | number
    processing: string | number
    review: string | number
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE c.status IN ('resolved', 'completed')) AS completed,
       COUNT(*) FILTER (
         WHERE c.status NOT IN ('resolved', 'completed', 'escalated')
           AND NOT EXISTS (
             SELECT 1 FROM human_review_tasks t
             WHERE t.conversation_id = c.conversation_id AND t.status = 'pending'
           )
       ) AS processing,
       (
         SELECT COUNT(*) FROM human_review_tasks WHERE status = 'pending'
       ) AS review
     FROM conversations c`,
  )

  return [
    {
      status: "Completed",
      count: asNumber(row?.completed),
      fill: "var(--chart-2)",
    },
    {
      status: "Processing",
      count: asNumber(row?.processing),
      fill: "var(--chart-1)",
    },
    {
      status: "Human Review",
      count: asNumber(row?.review),
      fill: "var(--chart-4)",
    },
  ]
}

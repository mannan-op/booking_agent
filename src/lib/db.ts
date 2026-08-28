import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL

const pool = connectionString
  ? new Pool({ connectionString, max: 8 })
  : null

export function isDatabaseConfigured() {
  return pool !== null
}

export async function query<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
) {
  if (!pool) {
    throw new Error("DATABASE_URL is not configured.")
  }

  const result = await pool.query<T>(text, params)
  return result.rows
}

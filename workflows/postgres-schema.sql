CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS branches (
  branch_id TEXT PRIMARY KEY,
  branch_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS products (
  product_id TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  part_number TEXT,
  brand TEXT,
  laptop_model_hint TEXT,
  voltage TEXT,
  capacity_wh NUMERIC,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS aliases (
  product_id TEXT NOT NULL REFERENCES products(product_id),
  alias_part_number TEXT NOT NULL,
  PRIMARY KEY (product_id, alias_part_number)
);

CREATE TABLE IF NOT EXISTS stock (
  product_id TEXT NOT NULL REFERENCES products(product_id),
  branch_id TEXT NOT NULL REFERENCES branches(branch_id),
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_qty INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ,
  PRIMARY KEY (product_id, branch_id)
);

CREATE TABLE IF NOT EXISTS sales (
  sale_id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(product_id),
  branch_id TEXT REFERENCES branches(branch_id),
  sale_date DATE NOT NULL,
  sale_price NUMERIC NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS conversations (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  detected_laptop TEXT,
  detected_battery TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  message_id TEXT PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(conversation_id),
  direction TEXT NOT NULL,
  content_type TEXT NOT NULL,
  raw_text TEXT,
  image_url TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS human_review_tasks (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(conversation_id),
  reason_code TEXT NOT NULL,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compatibility_cache (
  id BIGSERIAL PRIMARY KEY,
  query_model TEXT NOT NULL,
  candidate_ids JSONB,
  source TEXT,
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS event_log (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(conversation_id),
  workflow_name TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing_config (
  id BIGSERIAL PRIMARY KEY,
  formula_type TEXT NOT NULL DEFAULT 'average',
  markup_percent NUMERIC NOT NULL DEFAULT 20,
  min_sample_size INTEGER NOT NULL DEFAULT 1
);

INSERT INTO pricing_config (formula_type, markup_percent, min_sample_size)
SELECT 'average', 20, 1
WHERE NOT EXISTS (SELECT 1 FROM pricing_config);

CREATE TABLE IF NOT EXISTS final_pricing (
  id BIGSERIAL PRIMARY KEY,
  product_id TEXT NOT NULL,
  query_model TEXT,
  sample_count INTEGER,
  average_price NUMERIC,
  markup_percent NUMERIC,
  final_price NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(conversation_id),
  product_id TEXT NOT NULL,
  model TEXT,
  branch_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branch_routing_rules (
  id BIGSERIAL PRIMARY KEY,
  branch_id TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  rule JSONB,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO branch_routing_rules (branch_id, priority, rule)
SELECT 'BR01', 1, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM branch_routing_rules);


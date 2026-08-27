# Mock IMS Middleware API

Ek chhota FastAPI backend jo `data.json` (25 battery products, 4 branches, stock,
90-din sales history) ko **exact wahi endpoint contracts** ke sath serve karta hai
jo real spec ke Section 21.1 mein diye gaye hain.

**Maqsad:** n8n workflows (5 = IMS Search, 6 = Pricing) ko build/demo karna, bina
real IMS access ke. Jab client real access de, sirf `load_data()` function badalna
hoga (real DB/API query karne ke liye) — koi bhi n8n workflow change nahi karna
padega, kyunki endpoint shapes same rahenge.

## Setup

```bash
cd mock-middleware-api
pip install -r requirements.txt
python main.py
```

Server chalega: `http://localhost:8000`
Interactive API docs (auto-generated): `http://localhost:8000/docs`

## Auth

Har request mein header chahiye:
```
Authorization: Bearer demo-secret-key
```

Key change karni ho to:
```bash
export IMS_MIDDLEWARE_API_KEY="your-key-here"
python main.py
```

## Endpoints (Section 21.1 contract)

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/battery/search?model={model}` | GET | Exact/alias/partial model search |
| `/v1/battery/{product_id}/stock` | GET | Stock across all branches |
| `/v1/battery/{product_id}/stock?branch_id={id}` | GET | Branch-specific stock |
| `/v1/sales/{product_id}?days=30` | GET | Sales history for pricing window |
| `/v1/branches` | GET | Branch list |
| `/v1/health` | GET | Health check (no auth) |

## Test Examples (curl)

```bash
# Exact match
curl -H "Authorization: Bearer demo-secret-key" \
  "http://localhost:8000/v1/battery/search?model=HT03XL"

# No match (404 demo case)
curl -H "Authorization: Bearer demo-secret-key" \
  "http://localhost:8000/v1/battery/search?model=XYZ999"

# Stock, all branches
curl -H "Authorization: Bearer demo-secret-key" \
  "http://localhost:8000/v1/battery/P0001/stock"

# Stock, specific branch
curl -H "Authorization: Bearer demo-secret-key" \
  "http://localhost:8000/v1/battery/P0001/stock?branch_id=BR01"

# Sales history, 30-day window (pricing engine input)
curl -H "Authorization: Bearer demo-secret-key" \
  "http://localhost:8000/v1/sales/P0001?days=30"

# Branch list
curl -H "Authorization: Bearer demo-secret-key" \
  "http://localhost:8000/v1/branches"
```

## Simulating IMS-down (for testing n8n's error-handling / Section 17)

```bash
export SIMULATE_IMS_DOWN=1
python main.py
curl "http://localhost:8000/v1/health"   # returns 503 IMS_UNAVAILABLE
```

## Wiring into n8n

In your n8n **HTTP Request** nodes (Workflow 5 / Workflow 6), set:
- **URL:** `http://localhost:8000/v1/battery/search` (or your server's host/IP
  if n8n runs in a separate Docker container — use `http://host.docker.internal:8000`
  on Mac/Windows, or the container's network alias on Linux)
- **Header:** `Authorization: Bearer demo-secret-key`
- **Query Params:** as per each endpoint above

## Good demo test cases already baked into the dataset

- `HT03XL` → exact match, in stock at multiple branches
- `854108-855` → alias match (resolves to P0001 via `Product_Aliases`)
- Some products → zero sales in `Sales_History` → pricing engine will need
  Human Review (`insufficient_data`)
- Some products → zero stock everywhere → out-of-stock flow
- Random unknown model (e.g. `ZZZ000`) → 404, triggers compatibility research /
  Human Review path

## Next step

When real IMS access is granted, replace `load_data()` in `main.py` with a
real database query (or a call to the real IMS API) — the rest of the file,
and every n8n workflow built against it, stays unchanged.

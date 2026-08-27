"""
Mock IMS Middleware API
========================
Simulates the "thin, versioned middleware API" described in the spec (Section 6)
that sits in front of the real IMS. Serves the exact same endpoint contracts
(Section 21.1) but reads from a local JSON dataset instead of a real IMS.

Purpose: lets n8n Workflow 5 (IMS Search) and Workflow 6 (Pricing) be built and
demoed end-to-end without real IMS access. When real access is granted later,
only this file's data-loading logic changes (swap `load_data()` to query the
real DB/API) — every endpoint's request/response shape stays identical, so no
n8n workflow needs to change.

Run:
    pip install fastapi uvicorn --break-system-packages
    python main.py
    # or: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Auth:
    Every request needs: Authorization: Bearer <IMS_MIDDLEWARE_API_KEY>
    Default demo key is "demo-secret-key" (see API_KEY below) — change via
    the IMS_MIDDLEWARE_API_KEY environment variable.
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.responses import JSONResponse

# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------
API_KEY = os.environ.get("IMS_MIDDLEWARE_API_KEY", "demo-secret-key")
DATA_FILE = Path(__file__).parent / "data.json"

app = FastAPI(
    title="Mock IMS Middleware API",
    description="Demo-only middleware simulating the real IMS integration layer.",
    version="1.0.0",
)

# --------------------------------------------------------------------------
# Data loading (in-memory — swap this for a real DB/API call later)
# --------------------------------------------------------------------------
def load_data():
    with open(DATA_FILE) as f:
        return json.load(f)


DATA = load_data()
PRODUCTS_BY_ID = {p["product_id"]: p for p in DATA["products"]}
BRANCHES_BY_ID = {b["branch_id"]: b for b in DATA["branches"]}


def check_auth(authorization: Optional[str]):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail={"error": "MISSING_AUTH"})
    token = authorization.split(" ", 1)[1]
    if token != API_KEY:
        raise HTTPException(status_code=401, detail={"error": "INVALID_API_KEY"})


# --------------------------------------------------------------------------
# GET /v1/battery/search?model={model}
# Exact + partial model/part_number search
# --------------------------------------------------------------------------
@app.get("/v1/battery/search")
def search_battery(
    model: str = Query(..., description="Battery model or part number to search"),
    authorization: Optional[str] = Header(None),
):
    check_auth(authorization)
    model_norm = model.strip().lower()

    # 1. Exact match first (model or part_number)
    exact = [
        p for p in DATA["products"]
        if p["status"] == "active"
        and (p["model"].lower() == model_norm or p["part_number"].lower() == model_norm)
    ]

    if exact:
        matches = exact
    else:
        # 2. Check aliases table (alternate/equivalent part numbers)
        alias_product_ids = {
            a["product_id"] for a in DATA["aliases"]
            if a["alias_part_number"].lower() == model_norm
        }
        if alias_product_ids:
            matches = [
                p for p in DATA["products"]
                if p["product_id"] in alias_product_ids and p["status"] == "active"
            ]
        else:
            # 3. Fuzzy/partial fallback (ILIKE '%model%' equivalent)
            matches = [
                p for p in DATA["products"]
                if p["status"] == "active"
                and (model_norm in p["model"].lower() or model_norm in p["part_number"].lower())
            ]

    if not matches:
        return JSONResponse(
            status_code=404,
            content={"matches": [], "message": "No exact match"},
        )

    return {
        "matches": [
            {
                "product_id": p["product_id"],
                "model": p["model"],
                "brand": p["brand"],
                "voltage": p["voltage"],
                "capacity_wh": p["capacity_wh"],
                "status": p["status"],
            }
            for p in matches
        ]
    }


# --------------------------------------------------------------------------
# GET /v1/battery/{product_id}/stock
# GET /v1/battery/{product_id}/stock?branch_id={id}
# --------------------------------------------------------------------------
@app.get("/v1/battery/{product_id}/stock")
def get_stock(
    product_id: str,
    branch_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
):
    check_auth(authorization)

    if product_id not in PRODUCTS_BY_ID:
        raise HTTPException(status_code=404, detail={"error": "PRODUCT_NOT_FOUND"})

    rows = [s for s in DATA["stock"] if s["product_id"] == product_id]

    if branch_id:
        rows = [s for s in rows if s["branch_id"] == branch_id]
        if not rows:
            raise HTTPException(status_code=404, detail={"error": "NO_STOCK_RECORD"})
        return {"quantity": rows[0]["quantity"], "reserved_qty": rows[0]["reserved_qty"]}

    return {
        "product_id": product_id,
        "stock_by_branch": [
            {
                "branch_id": s["branch_id"],
                "branch_name": BRANCHES_BY_ID.get(s["branch_id"], {}).get("branch_name", "Unknown"),
                "quantity": s["quantity"],
                "reserved_qty": s["reserved_qty"],
            }
            for s in rows
        ],
    }


# --------------------------------------------------------------------------
# GET /v1/sales/{product_id}?days=30
# --------------------------------------------------------------------------
@app.get("/v1/sales/{product_id}")
def get_sales(
    product_id: str,
    days: int = Query(30, ge=1, le=365),
    authorization: Optional[str] = Header(None),
):
    check_auth(authorization)

    if product_id not in PRODUCTS_BY_ID:
        raise HTTPException(status_code=404, detail={"error": "PRODUCT_NOT_FOUND"})

    cutoff = datetime.now() - timedelta(days=days)
    rows = [
        s for s in DATA["sales"]
        if s["product_id"] == product_id
        and datetime.strptime(s["sale_date"], "%Y-%m-%d") >= cutoff
    ]

    return {
        "product_id": product_id,
        "window_days": days,
        "sample_size": len(rows),
        "sales": [
            {
                "sale_price": s["sale_price"],
                "qty": s["qty"],
                "sale_date": s["sale_date"],
                "branch_id": s["branch_id"],
            }
            for s in rows
        ],
    }


# --------------------------------------------------------------------------
# GET /v1/branches
# --------------------------------------------------------------------------
@app.get("/v1/branches")
def get_branches(authorization: Optional[str] = Header(None)):
    check_auth(authorization)
    return {"branches": DATA["branches"]}


# --------------------------------------------------------------------------
# Simulate IMS being down (for testing Section 17 error-handling fallback)
# Toggle via env var to test n8n's retry/Human-Review behavior
# --------------------------------------------------------------------------
@app.get("/v1/health")
def health():
    if os.environ.get("SIMULATE_IMS_DOWN") == "1":
        return JSONResponse(status_code=503, content={"error": "IMS_UNAVAILABLE"})
    return {"status": "ok", "products_loaded": len(DATA["products"])}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

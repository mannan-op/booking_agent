# VoltOps Battery Automation

Admin dashboard for the laptop-battery sales prototype. n8n runs the existing automation workflows, Postgres stores operational + seeded IMS catalog data, and the mock IMS API serves the Section 21.1 contract.

## Demo today

1. Copy env and add your LLM keys (Workflow 7B uses Gemini/Groq):

```bash
cp .env.example .env.local
# also used by docker compose:
cp .env.example .env
```

Set `GEMINI_API_KEY` (and optionally `GROQ_API_KEY`) in `.env` and `.env.local`.

2. Start Postgres, mock IMS, and n8n:

```bash
docker compose up --build
```

Wait until n8n logs `Editor is now accessible via: http://localhost:5678`.

3. Start the UI:

```bash
pnpm install
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000), log in (`nina.v@example.com` / `demo123`), then:

- **Inventory** — 25 products / 4 Lahore branches from the mock Excel dataset
- **Analytics** — 90-day sales history
- **Customer Queries** — inbound WhatsApp conversations after n8n intake

## WhatsApp (customer chat, Cloud API)

The dashboard is for operators. Customers talk on WhatsApp. This uses the **WhatsApp Cloud API (Meta)** with a business number — full automation: inbound → n8n → auto-reply.

1. Create a Meta app / WhatsApp Business Account with a business phone number, then copy:
   - `WHATSAPP_ACCESS_TOKEN` (permanent/System User token)
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_APP_SECRET`
   - `WHATSAPP_VERIFY_TOKEN` (any random string you choose)
2. Put these in `.env.local` (see `.env.example`), plus `PUBLIC_APP_URL`. Restart `pnpm dev`.
3. If n8n needs to reach the UI for image analysis, set `PUBLIC_APP_URL` to the public HTTPS origin (for a local demo, `ngrok http 3000`).
4. In your Meta Webhook config, point the app webhook at:
   `https://your-public-https-host/api/whatsapp/webhook`
   and subscribe to the **messages** field. The first Meta verification call hits `GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=<WHATSAPP_VERIFY_TOKEN>&hub.challenge=...` and is answered automatically.
5. Message the business number from a customer phone. Operators see the thread on **Customer Queries**.

> Cloud API only allows free-form replies within the 24-hour customer-service window. A customer must message first before your auto-reply sends.

## WhatsApp (customer chat) — legacy WaAPI option

Prototype alternative that scans a QR with a normal WhatsApp number (uses [WaAPI](https://waapi.app/)) instead of Meta Cloud API:

1. Create an instance at [waapi.app](https://waapi.app/), scan the QR from WhatsApp, and copy the instance ID plus API token.
2. Put these in `.env.local` (and restart `pnpm dev`):

```bash
WAAPI_TOKEN=your-waapi-token
WAAPI_INSTANCE_ID=123
WAAPI_WEBHOOK_SECRET=choose-a-long-random-string
PUBLIC_APP_URL=https://your-public-https-host
```

3. Local webhooks need HTTPS. Example: `ngrok http 3000`, then set `PUBLIC_APP_URL` to the ngrok origin.
4. In the WaAPI instance, set webhook URL to `https://your-public-https-host/api/whatsapp/webhook?token=WAAPI_WEBHOOK_SECRET` and subscribe to **message** only.
5. Message the linked number from a customer phone. Operators see the thread on **Customer Queries**. WaAPI trial accounts can only reply to the registered number.

If n8n replies fail, confirm Workflow 1 is active and `GEMINI_API_KEY` is loaded in the n8n container (`docker compose up -d --force-recreate n8n`).

## Local URLs

| Service | URL |
|---|---|
| Next.js | http://localhost:3000 |
| n8n | http://localhost:5678 |
| Mock IMS docs | http://localhost:8000/docs |
| Postgres | localhost:5433 user/db `voltops` |

First n8n visit may ask you to create an owner account. Webhooks still work after the CLI import. If chat fails, confirm Workflow 1 is active in n8n and `N8N_WEBHOOK_URL=http://localhost:5678/webhook/battery-query`.

# VMS — Production Deployment Guide

## Stack
- **Hosting**: Cloudflare Pages (free tier, global edge)
- **Database**: Cloudflare D1 (SQLite at the edge, free tier)
- **Storage**: Cloudflare R2 (images/assets, free 10 GB/month)
- **Payments**: Razorpay (free until first sale, then 2% per txn)

---

## First-time setup

### 1. Prerequisites
```bash
npm install
npm install -g wrangler
wrangler login          # opens browser → authorise with Cloudflare account
```

### 2. Create D1 database
```bash
wrangler d1 create vms-db
# Output includes database_id — paste it into wrangler.toml:
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 3. Run migrations (creates all tables)
```bash
# Production D1:
npm run db:migrate

# Local dev (SQLite shim):
npm run db:migrate:local
```

### 4. Create R2 bucket (product images)
```bash
wrangler r2 bucket create vms-assets
```

### 5. Set Cloudflare secrets
```bash
# Generate a strong JWT secret:
openssl rand -base64 32 | wrangler secret put JWT_SECRET

# Razorpay API keys (from dashboard.razorpay.com → Settings → API Keys):
wrangler secret put RAZORPAY_KEY_ID
wrangler secret put RAZORPAY_KEY_SECRET

# Razorpay webhook secret (from Dashboard → Settings → Webhooks):
wrangler secret put RAZORPAY_WEBHOOK_SECRET
```

### 6. Set public env vars (non-sensitive)
Edit `wrangler.toml` → `[vars]` section:
```toml
NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_live_xxxxxxxxxxxx"
NEXT_PUBLIC_APP_URL = "https://your-domain.com"
```

### 7. Local .env.local (dev only)
```bash
cp .env.example .env.local
# Fill in your test keys from Razorpay dashboard
```

---

## Deploy

```bash
npm run deploy
# Builds → outputs to .vercel/output/static → deploys to Cloudflare Pages
# First deploy creates: https://vms-ecommerce.pages.dev
```

### Custom domain (free with your own domain)
1. Cloudflare Dashboard → Pages → vms-ecommerce → Custom domains
2. Add your domain — DNS is configured automatically if managed by Cloudflare

---

## Razorpay webhook (required for production)

Webhooks are the server-side confirmation of payment. They fire even if the customer closes their browser.

1. [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → Webhooks → **+ Add New Webhook**
2. **URL**: `https://your-domain.com/api/payments/webhook`
3. **Events to subscribe**:
   - `payment.captured`
   - `payment.failed`
4. **Secret**: paste the same value as `RAZORPAY_WEBHOOK_SECRET`
5. Save — Razorpay will verify the URL responds with 200

---

## Create first admin account

### Option A — via API (recommended)
```bash
# 1. Register a user via the app at /register
# 2. Promote to admin via D1:
wrangler d1 execute vms-db --command \
  "UPDATE users SET role='admin' WHERE email='admin@yourdomain.com'"
```

### Option B — direct insert
```bash
# Password "Admin@123" hashed with bcrypt rounds=12
# Generate your own: node -e "const b=require('bcryptjs'); b.hash('YourPass',12).then(console.log)"
wrangler d1 execute vms-db --command \
  "INSERT INTO users (email, password_hash, name, role, is_verified)
   VALUES ('admin@yourdomain.com', '\$2a\$12\$...', 'Admin', 'admin', 1)"
```

---

## Seeding products

Export your local dev database to production:
```bash
# 1. Dump local product data
wrangler d1 export vms-db --local --output=local-backup.sql

# 2. Or write a custom seed:
wrangler d1 execute vms-db --file=migrations/seed.sql
```

---

## Local development

```bash
npm run dev              # Standard Next.js dev server (port 3000)
                         # Uses local SQLite at .wrangler/state/v3/d1/

# Cloudflare edge simulation:
npm run pages:dev        # Runs via wrangler — D1 bindings work exactly as in prod
```

---

## Security checklist before going live

- [ ] `JWT_SECRET` is a random 32+ byte string (not the example value)
- [ ] Razorpay live keys (`rzp_live_*`) are set (not test keys)
- [ ] `RAZORPAY_WEBHOOK_SECRET` is set and webhook URL is configured
- [ ] Admin account created and password changed from default
- [ ] `NEXT_PUBLIC_APP_URL` points to your production domain
- [ ] R2 bucket CORS configured if serving images from custom domain

---

## Free tier limits (Cloudflare)

| Resource | Free limit |
|---|---|
| Pages requests | 500K/month |
| D1 reads | 5M/month |
| D1 writes | 100K/month |
| R2 storage | 10 GB |
| R2 operations | 1M/month |

More than enough to run a pharmacy store at moderate volume.

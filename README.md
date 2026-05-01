# 💊 VMS — Vipan Medical Store

Online storefront for Vipan Medical Store — a pharmacy serving both retail and wholesale customers.

> **Live** → [vms-4q7.pages.dev](https://vms-4q7.pages.dev)

---

## Stack

| Layer      | Tech                                  |
| ---------- | ------------------------------------- |
| Framework  | Next.js 15 (App Router, Edge Runtime) |
| Styling    | Tailwind CSS 4 + Framer Motion        |
| Database   | Cloudflare D1 (SQLite)                |
| Storage    | Cloudflare R2                         |
| Auth       | JWT (jose) + OTP + Google OAuth       |
| Payments   | Razorpay                              |
| Monitoring | Sentry                                |
| Hosting    | Cloudflare Pages                      |

## Features

- **Multi-tier pricing** — MRP / Retailer / Wholesaler rates per product
- **Product catalog** — categories, search, variant groups, pagination
- **Cart & checkout** — with address management and Razorpay integration
- **Admin panel** — products, orders, users, analytics, bulk import
- **Google OAuth** — one-tap sign in alongside phone/OTP login

## Getting Started

```bash
# install
npm install

# set up local D1
npm run db:migrate:local

# run dev server
npm run dev
```

## Deploy

```bash
# build + deploy to Cloudflare Pages
npm run deploy
```

## Project Structure

```
src/
├── app/
│   ├── (shop)/        # storefront — home, products, cart, checkout
│   ├── (auth)/        # login, register
│   ├── admin/         # dashboard, products, orders, users, analytics
│   └── api/           # REST endpoints
├── components/        # shared UI
├── hooks/             # useCart, useAdminAuth
├── lib/               # db, auth, pricing, observability
└── middleware.ts       # auth + admin route protection
```

## License

Private — all rights reserved.

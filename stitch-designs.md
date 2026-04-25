# VMS — Stitch MCP Design Prompts

**Project:** Vipan Medical Store (healthcare e-commerce)  
**Brand color:** Teal `#0e9faa` | **Font:** Inter | **Framework:** Next.js + Tailwind CSS

## ✅ Generated Project

| Resource | Value |
|----------|-------|
| **Stitch Project ID** | `5770715802724318458` |
| **GCP Project** | `vms-ecommerce-09045` |
| **Open in Stitch** | https://stitch.withgoogle.com |

## ✅ Generated Screens

| Screen | Stitch Screen ID |
|--------|-----------------|
| Homepage | `943a907d26534af681f07e5400755860` |
| Product Catalogue | `199f4541d2a64847ae09496540534409` |
| Product Detail | `e72b75736f584baba5f9213d70d5a9a5` |
| Shopping Cart | `63763955209d470988a2cc639835d964` |
| Checkout | `a719c861e873472784b494edd851b97a` |
| Orders | `5c115b04ee814e42a42036dba751ea5d` |
| Admin Dashboard | `175aced70c2f42d3a66738f5032e7f0c` |

### CLI commands

```bash
# Preview all screens locally
STITCH_ACCESS_TOKEN=$(CLOUDSDK_CONFIG=~/.stitch-mcp/config ~/.stitch-mcp/google-cloud-sdk/bin/gcloud auth print-access-token) \
GOOGLE_CLOUD_PROJECT=vms-ecommerce-09045 \
  npx @_davideast/stitch-mcp serve -p 5770715802724318458

# Get HTML code for a screen
STITCH_ACCESS_TOKEN=$(...) GOOGLE_CLOUD_PROJECT=vms-ecommerce-09045 \
  npx @_davideast/stitch-mcp tool get_screen_code \
    -d '{"projectId":"5770715802724318458","screenId":"943a907d26534af681f07e5400755860"}'
```

Use these prompts to re-generate or create new screens:

---

## Screen 1 — Homepage / Hero

```
Design a homepage for VMS (Vipan Medical Store), a trusted Indian pharmacy brand
established 2008. Hero section with a teal-to-cyan gradient background (#0e9faa to
#3fbec7), large headline "Your Health, Our Priority" in bold white, subtext about
quality medicines, two CTAs: "Shop Now" (white pill button) and "VMS Generics"
(glass/frosted pill button). Right side: a large glowing pill emoji or 3D capsule
illustration floating with gentle animation. Below hero: a horizontal scrollable
category strip (Medicines, Vitamins, Skin Care, Baby Care, First Aid, Devices,
Ayurvedic) as rounded pill chips in light teal border. Then a 5-column product grid
"Featured Products" with cards showing product image, name, category badge, price in
INR, and an Add to Cart button. Footer trust badges row: Fast Delivery 🚚,
100% Genuine ✅, Expert Support 💬 on a light teal background.
Clean, medical-professional aesthetic. White surfaces, teal accents, Inter font.
```

---

## Screen 2 — Product Listing / Catalogue

```
Design a product catalogue page for VMS pharmacy store. Left sidebar with filters:
search bar, category checkboxes (Medicines, Vitamins, Skin Care, Baby Care, First Aid,
Devices, Ayurvedic), brand filter (VMS Generic, Third-party), price range slider in INR,
in-stock toggle. Main area: sort dropdown, product count, responsive grid (4 columns
desktop, 2 mobile) of product cards. Each card: white rounded-2xl card with soft shadow,
product image (with 💊 emoji fallback), VMS Generic badge in teal if applicable,
product name, category, price in bold teal (₹XX.XX), stock indicator ("Only 3 left"
in amber), Add to Cart button. Teal primary brand color #0e9faa, Inter font, clean
healthcare aesthetic.
```

---

## Screen 3 — Product Detail Page

```
Design a product detail page for VMS pharmacy. Two-column layout: left is a large
white card with the product image centered (or 💊 emoji), right shows: VMS Generic
badge in teal (if applicable), product name as H1, category in muted text, description
paragraph, large price display "₹XX.XX" in teal bold with "incl. all taxes" note,
stock status ("Only 5 left" in amber or "Out of stock" in red), Add to Cart button
(full-width teal rounded pill) with quantity selector. Below: related products strip.
White/light surface, teal accents, Inter font, professional medical design.
```

---

## Screen 4 — Shopping Cart

```
Design a shopping cart page for VMS pharmacy. Two-column layout (2/3 + 1/3).
Left: list of cart items, each as a white rounded card with product thumbnail (64x64,
💊 emoji fallback), product name, brand, price in teal, quantity stepper (- count +
in circular buttons), remove button (trash icon in red on hover). Right: order summary
sticky card — Subtotal, Delivery (Free in green), divider, Total in bold, then a
"Proceed to Checkout" teal pill button. Empty state: shopping bag icon with "Your cart
is empty" message and Browse products link. Teal #0e9faa, white cards, clean layout.
```

---

## Screen 5 — Checkout Page

```
Design a checkout page for VMS pharmacy. Two-column: left is a multi-step form with
sections — Delivery Address (name, phone, address, city, pincode, state, India),
then Payment Method (Razorpay UPI, Cards, Net Banking illustrated with icons, "Pay ₹XX"
teal button). Right column shows order summary with item thumbnails, quantities, and
total. Progress steps indicator at top: Cart → Address → Payment → Confirmation.
Form fields with teal focus ring, clean white cards, professional medical look.
```

---

## Screen 6 — Order Confirmation / Orders List

```
Design an orders page for VMS pharmacy. Tab bar: "My Orders" active. List of order cards,
each showing: order number, date, status badge (Processing in amber, Shipped in blue,
Delivered in green, Cancelled in red), item thumbnails strip, total amount, "View Details"
link. Order detail view: timeline tracker (Order Placed → Processing → Shipped →
Delivered) with teal active step indicators, items list, delivery address, payment info,
invoice download button. Clean, trustworthy pharmacy aesthetic.
```

---

## Screen 7 — Admin Dashboard

```
Design an admin dashboard for VMS pharmacy. Dark sidebar (slate-900) with VMS logo,
navigation: Dashboard, Products, Orders, Users, Settings. Main area with stats cards:
Total Orders, Revenue (₹), Products, Active Users — each with trend indicator. Recent
orders table with status badges. Product inventory table with low-stock warnings in amber.
Revenue chart (line graph, teal color). Clean admin aesthetic, white main area, teal
accents for interactive elements and charts.
```

---

## MCP Config (already set up in `~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["@_davideast/stitch-mcp", "proxy"],
      "env": {
        "STITCH_API_KEY": "<YOUR_VALID_KEY>"
      }
    }
  }
}
```

## Getting a valid API key

1. Go to **https://stitch.withgoogle.com**
2. Sign in with your Google account
3. Click profile → **Settings** → **API Keys**
4. Create a new key and replace `<YOUR_VALID_KEY>` in `~/.cursor/mcp.json`

Then in Cursor, ask: _"Using Stitch, create a VMS medical store project and generate all 7 screens using the prompts from stitch-designs.md"_

# Farm → Products display cleanup and bidirectional navigation

## Context

Farms currently have a single free-text `primary_crop` field on the backend
`Farm` model (e.g. "Heritage Joha Rice"), displayed on the farm detail page
as a standalone "🌾 Active Organic Harvest" section. This doesn't reflect
reality: a farm produces a *list* of distinct products (crops, vegetables,
fruits, or other harvests), each already modeled as a separate `Product` row
with its own price, availability, and images.

The farm detail page already has a working "Crops Cultivated Here" grid
showing real `Product` rows for that farm, and the product detail page
already links back to its farm ("Cultivated at {farm.name}"). The one
missing link: the products *list* page (`/products`) shows no farm
information at all on its cards, so there's no way to jump from a product in
the list view to its farm.

This change removes the misleading single-crop section, adds the missing
products-list → farm link, and preserves the certifications data that
currently lives inside the section being removed.

**Terminology note**: products aren't always "crops" — farms may produce
vegetables, fruits, or other harvests. All new/changed copy in this work
uses generic wording ("products" or "harvests"), not "crop"-specific
language. The existing "Crops Cultivated Here" heading is being renamed for
the same reason.

## Changes

### 1. Backend (`shopmekrihabackend`, `config/api.py`)

Add `farm_name: str` to `ProductOutSchema`, resolved via `obj.farm.farm_name`.
No migration needed (not a model field, just an API response field pulled
through the existing `farm` FK). This lets the products list page show which
farm a product belongs to without a second client-side fetch + manual join.

### 2. Homepage registration form (`pages/index.js`)

Remove the "Primary Crop" text input and its `registerPrimaryCrop` state
from the "Register your Farm" modal. The submit payload to
`/api/farms/register` stops including `primary_crop`.

### 3. Registration proxy (`pages/api/farms/register.js`)

- Remove `primary_crop` from the required-fields validation check.
- Always forward `primary_crop=""` (empty string) to the Django API in the
  form body, regardless of what the client sends. The backend column stays
  required at the model level (`CharField` without `blank=True`), but
  `.objects.create()` doesn't run `full_clean()`, so an empty string saves
  fine with zero backend schema changes.

### 4. Farm detail page (`pages/farms/[id].js`)

- Remove the entire "🌾 Active Organic Harvest" block (the `farm?.harvest`
  text + the certifications badge row lived together in this block).
- Move the certifications badges into the existing meta grid (currently:
  Farmer In Charge / Established / Land Size / Coordinates) as a new row,
  so that data isn't silently dropped. Only render the row if
  `farm?.certifications` is a non-empty array.
- Rename the "Crops Cultivated Here" heading to "Products From This Farm"
  (generic wording, matches the terminology note above). No other change to
  that grid — it already correctly lists real `Product` rows for the farm.
- Update the `<meta name="description">` tag, which currently references
  `farm?.harvest` ("Dynamic details about organic harvesting of...") — reword
  to reference `farm?.district`/`farm?.about` instead, since `harvest` is no
  longer displayed anywhere on this page.

### 5. Products directory page (`pages/products/index.js`)

- Fetch already returns `farm_name` per product (via change #1) — no new
  fetch needed on this page.
- Add a small clickable badge near the top of each product card: "🏡
  {farm_name}", linking to `/farms/{product.farm_id}`. Styled consistently
  with the existing emerald badge pattern already used on the product detail
  page's farm link, sized to fit the smaller product-card format.
- Structural change required: each card is currently a single `<Link>`
  wrapping the whole card, and nesting a second `<Link>` inside it is
  invalid HTML (nested `<a>` tags) and breaks click handling. Restructure
  each card to a `<div>` wrapper, with the image/text area wrapped in its
  own `<Link>` to the product detail page, and the farm badge as a sibling
  `<Link>` to the farm page.

## Non-goals (explicitly out of scope, per earlier discussion)

- No farm filter/dropdown on the products list page.
- No backend migration or change to the `Farm.primary_crop` column itself.
- No change to the product detail page's existing farm link.
- No change to the farm detail page's existing product grid data/logic
  beyond the heading rename.

## Testing

- `npm run lint` and `npm run build` on the frontend.
- Manual verification against the live backend (as done for prior changes
  this session): confirm `/api/products` now includes `farm_name`, confirm
  the farm detail page no longer shows the old harvest section but still
  shows certifications (for farms that have them) and the renamed product
  grid heading, confirm the products list page shows a working farm badge
  per card that navigates to the right farm.
- Confirm the homepage registration form still successfully registers a farm
  with the Primary Crop field removed (empty string reaches the backend
  without a validation error).

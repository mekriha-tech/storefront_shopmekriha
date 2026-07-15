# Hero Copy, CTA Links, Logo Fixes — Design

Small scoped design for three unrelated fixes bundled together in one pass on
`feature-frontend-refactor` (to be merged to `dev`, then `main` later).

## 1. Hero section (`pages/index.js` "home" section)

- Remove the "🌱 Farmer-First Marketplace" pill badge entirely (both `en`
  and `as`).
- Replace the hero title/description copy:
  - EN: "From the fertile banks of the Brahmaputra and the nutrient-rich
    soils of Assam, we harvest organic, naturally grown food for you —
    collaborating directly with farms and farmers across the region."
  - AS: matching Assamese translation.
- Rename the two hero CTA buttons and make them functional:
  - "Know More" → **"Our Farms"** — anchor link (`<a href="#about">`)
    scrolling to the existing Partner Farms section, which already lists
    farm circles + an "Explore All Farms" link into `/farms`.
  - "Our Produce" → **"Our Harvests"** — `<Link href="/products">`,
    routing to the product listing page.
- Apply text changes in both `defaultTranslations` inside `pages/index.js`
  and the runtime-fetched override `locales/translations.json`, so the two
  stay in sync (the override wins at runtime if present).

## 2. Logo placeholder bug

Four pages render the literal text `Logo` in the header instead of an
image — a leftover placeholder never wired up:

- `pages/farms/[id].js`
- `pages/farms/index.js`
- `pages/products/index.js`
- `pages/products/[id].js`

Fix: replace with the real Mekriha logo `<Image>`, matching the pattern
already used on the homepage header (`/mekriha_logo.png`,
`h-7 md:h-8 w-auto`, wrapped in `Link href="/"`). These pages have no
language toggle, so no Assamese variant is needed here.

Not in scope: the farm-specific circular logo badges (`farm.logoImage`)
elsewhere on the farm detail page already work correctly.

## 3. Assamese logo sizing (`pages/index.js` header + footer)

The Assamese wordmark PNG has a narrower aspect ratio (~2.99:1) than the
English one (~4.66:1), so at the same fixed height it reads as visually
smaller. Fix: bump rendered height only when `lang === "as"`, width stays
`auto` so it scales proportionally:

- Header: `h-7 md:h-8` (EN) → `h-8 md:h-9` (AS)
- Footer: `h-7` (EN) → `h-8` (AS)

## Out of scope

- Backend/API changes.
- Any other pages beyond the four listed above.
- Redesigning the Partner Farms section itself (it already supports the
  "click through to a farm" flow the "Our Farms" button now leads into).

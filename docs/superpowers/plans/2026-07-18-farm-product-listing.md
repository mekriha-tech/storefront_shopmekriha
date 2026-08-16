# Farm/Product Listing Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the misleading single-crop "Active Organic Harvest" farm section, add a farm badge/link to the products list page for bidirectional navigation, and drop the Primary Crop field from public farm registration.

**Architecture:** Two repos change. Backend (`shopmekrihabackend`) gets one additive API field (`farm_name` on `ProductOutSchema`, no migration). Frontend (`storefront_shopmekriha`) gets four page/component edits: registration form, registration proxy, farm detail page, products list page.

**Tech Stack:** Django 5.1 + django-ninja (backend), Next.js 16 pages router + React 19 + Tailwind v4 (frontend). No test framework configured in either repo — verification gates are `python manage.py check` (backend) and `npm run lint` + `npm run build` (frontend), plus manual curl/browser checks against the live Railway backend, consistent with how every other change this session was verified.

## Global Constraints

- All new/changed user-facing copy must use generic wording ("products"/"harvests"), never "crop"-specific language (per spec terminology note).
- No backend migration — the `farm_name` addition is an API response field only, not a model change.
- No changes to `Farm.primary_crop` at the database/model level — it stays required there; only the *public form* stops collecting it.
- No farm filter/dropdown on the products list page (explicitly out of scope).
- No change to the farm detail page's product grid data/matching logic, or to the product detail page's existing farm link.

---

### Task 1: Backend — expose `farm_name` on `ProductOutSchema`

**Files:**
- Modify: `shopmekrihabackend/config/api.py:100-133` (the `ProductOutSchema` class)

**Interfaces:**
- Consumes: `Product.farm` FK (already exists, `core/models.py`), `Farm.farm_name` (already exists).
- Produces: `/api/products` and `/api/products/add` responses now include a `farm_name: str` field. Later tasks (Task 5, frontend) rely on this exact field name.

- [ ] **Step 1: Add the field and resolver**

In `shopmekrihabackend/config/api.py`, modify the `ProductOutSchema` class:

```python
class ProductOutSchema(Schema):
    id: int
    farm_id: int
    farm_name: str
    name: str
    tags: str
    description: Optional[str] = None
    price: Optional[float] = None
    discount_price: Optional[float] = None
    ready_by_timeline: str
    measure_of_unit: str       
    quantity: int              
    availability_status: str
    image1: Optional[str] = None
    image2: Optional[str] = None
    image3: Optional[str] = None

    @staticmethod
    def resolve_farm_name(obj):
        return obj.farm.farm_name

    @staticmethod
    def resolve_availability_status(obj):
        if obj.ready_by_timeline == 'current' and obj.price is not None and obj.discount_price is not None:
            return "Available"
        return "Enquiry"

    @staticmethod
    def resolve_image1(obj):
        return obj.image1.url if obj.image1 else None

    @staticmethod
    def resolve_image2(obj):
        return obj.image2.url if obj.image2 else None

    @staticmethod
    def resolve_image3(obj):
        return obj.image3.url if obj.image3 else None
```

Only the `farm_name: str` line and the `resolve_farm_name` static method are new; everything else in the class is unchanged (shown in full above so the whole class is visible in one place).

- [ ] **Step 2: Verify with Django's system check**

Run (from `shopmekrihabackend/`, using the project's existing `.venv`):
```bash
.venv/Scripts/python.exe manage.py check
```
Expected: `System check identified 7 issues (0 silenced).` — the same 7 pre-existing `models.W042` warnings seen throughout this session, and no new errors. If any error mentions `ProductOutSchema` or `resolve_farm_name`, the field/resolver has a typo — fix before continuing.

- [ ] **Step 3: Verify against a real local server**

Run the dev server in the background:
```bash
rm -f db.sqlite3
.venv/Scripts/python.exe manage.py migrate
.venv/Scripts/python.exe manage.py runserver 127.0.0.1:8123
```
In a separate command, register a farm and a product, then confirm `farm_name` appears:
```bash
curl -s -X POST http://127.0.0.1:8123/api/farms/register -F "farm_name=Test Farm" -F "farmer_name=Test Farmer" -F "phone=1234567890" -F "location=Test Loc" -F "total_area_acres=5" -F "primary_crop=Rice"
curl -s -X POST http://127.0.0.1:8123/api/products/add -F "farm_id=1" -F "name=Test Product" -F "tags=Test" -F "ready_by_timeline=current" -F "measure_of_unit=kg" -F "quantity=10"
curl -s http://127.0.0.1:8123/api/products
```
Expected: the final `curl` output includes `"farm_name": "Test Farm"` in the product object. Stop the server afterward and remove the throwaway `db.sqlite3` (`rm -f db.sqlite3`).

- [ ] **Step 4: Commit**

```bash
cd shopmekrihabackend
git add config/api.py
git commit -m "Expose farm_name on ProductOutSchema

Lets the storefront show which farm a product belongs to directly
from /api/products, without a second client-side fetch + join
against /api/farms."
```

---

### Task 2: Frontend — remove Primary Crop input from the public registration form

**Files:**
- Modify: `storefront_shopmekriha/pages/index.js:170` (state declaration)
- Modify: `storefront_shopmekriha/pages/index.js:183` (payload)
- Modify: `storefront_shopmekriha/pages/index.js:212` (reset on success)
- Modify: `storefront_shopmekriha/pages/index.js:1071-1081` (JSX input block)

**Interfaces:**
- Consumes: none new.
- Produces: the payload sent to `POST /api/farms/register` from this page no longer includes a `primary_crop` key. Task 3 (the proxy) must not treat its absence as a validation failure.

- [ ] **Step 1: Remove the state declaration**

In `pages/index.js`, delete line 170:
```javascript
  const [registerPrimaryCrop, setRegisterPrimaryCrop] = useState("");
```
(This is the only line between `registerTotalArea`'s declaration on line 169 and the `handlePartnerRegisterSubmit` function starting on line 172 — removing it leaves those two lines adjacent.)

- [ ] **Step 2: Remove it from the submit payload**

Change (around line 176-184):
```javascript
    const payload = {
      farm_name: registerFarmName,
      farmer_name: registerFarmerName,
      phone: registerPhone,
      email: registerEmail || undefined,
      location: registerLocation,
      total_area_acres: parseFloat(registerTotalArea),
      primary_crop: registerPrimaryCrop
    };
```
to:
```javascript
    const payload = {
      farm_name: registerFarmName,
      farmer_name: registerFarmerName,
      phone: registerPhone,
      email: registerEmail || undefined,
      location: registerLocation,
      total_area_acres: parseFloat(registerTotalArea)
    };
```

- [ ] **Step 3: Remove the reset call on successful submit**

Around line 203-213, delete the line `setRegisterPrimaryCrop("");` from the `.then(() => { ... })` success handler block (it currently sits between `setRegisterTotalArea("");` and the `alert(...)` call).

- [ ] **Step 4: Remove the input's JSX block**

In the registration modal form JSX, delete this entire block (currently lines 1071-1081):
```javascript
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Primary Organic Crop *</label>
                  <input
                    type="text"
                    required
                    value={registerPrimaryCrop}
                    onChange={(e) => setRegisterPrimaryCrop(e.target.value)}
                    placeholder="e.g. Joha Rice / Yellow Mustard"
                    className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#005748] w-full bg-white text-gray-800"
                  />
                </div>
```
The block immediately before it (Total Area) and immediately after it (Farm Location, which has `sm:col-span-2`) are untouched — just this one `<div>` is removed.

- [ ] **Step 5: Verify no leftover references**

Run:
```bash
cd storefront_shopmekriha
grep -n "registerPrimaryCrop\|Primary Organic Crop" pages/index.js
```
Expected: no output (empty). If anything prints, a reference was missed — remove it before continuing.

- [ ] **Step 6: Lint**

```bash
npm run lint
```
Expected: no errors (matches the clean baseline from every prior change this session).

- [ ] **Step 7: Commit**

```bash
git add pages/index.js
git commit -m "Remove Primary Crop field from public farm registration form

Farms will list actual products instead of a single free-text crop
field, so new farmers shouldn't be asked for one upfront. The backend
Farm.primary_crop column and admin field are untouched - the proxy
(pages/api/farms/register.js) forwards an empty string for it."
```

---

### Task 3: Frontend — stop requiring `primary_crop` in the registration proxy

**Files:**
- Modify: `storefront_shopmekriha/pages/api/farms/register.js`

**Interfaces:**
- Consumes: `req.body` from Task 2's form (no `primary_crop` key present).
- Produces: still POSTs a `primary_crop` field (empty string) to the Django backend, so `Farm.objects.create(...)` in `config/api.py` (which requires it as a non-optional `Form(...)` parameter) doesn't fail.

- [ ] **Step 1: Update the required-fields destructure and check**

Change:
```javascript
  const { farm_name, farmer_name, phone, email, location, total_area_acres, primary_crop } = req.body;
  if (!farm_name || !farmer_name || !phone || !location || total_area_acres === undefined || !primary_crop) {
    return res.status(400).json({ error: "Missing required fields: farm_name, farmer_name, phone, location, total_area_acres, primary_crop" });
  }
```
to:
```javascript
  const { farm_name, farmer_name, phone, email, location, total_area_acres } = req.body;
  if (!farm_name || !farmer_name || !phone || !location || total_area_acres === undefined) {
    return res.status(400).json({ error: "Missing required fields: farm_name, farmer_name, phone, location, total_area_acres" });
  }
```

- [ ] **Step 2: Update the local-mode mock response**

Change the mock farm object (inside the `if (!baseUrl) { ... }` block):
```javascript
      farm: {
        id: Math.floor(Math.random() * 100000),
        farm_name,
        farmer_name,
        phone,
        email: email || null,
        location,
        total_area_acres: parseFloat(total_area_acres),
        primary_crop,
        created_at: new Date().toISOString()
      }
```
to:
```javascript
      farm: {
        id: Math.floor(Math.random() * 100000),
        farm_name,
        farmer_name,
        phone,
        email: email || null,
        location,
        total_area_acres: parseFloat(total_area_acres),
        primary_crop: "",
        created_at: new Date().toISOString()
      }
```

- [ ] **Step 3: Always forward an empty `primary_crop` to the real backend**

Change:
```javascript
    formBody.push("total_area_acres=" + encodeURIComponent(total_area_acres));
    formBody.push("primary_crop=" + encodeURIComponent(primary_crop));
```
to:
```javascript
    formBody.push("total_area_acres=" + encodeURIComponent(total_area_acres));
    formBody.push("primary_crop=");
```

- [ ] **Step 4: Lint**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 5: Manual verification against the live backend**

```bash
curl -s -X POST http://127.0.0.1:3000/api/farms/register -H "Content-Type: application/json" -d '{"farm_name":"Plan Test Farm","farmer_name":"Tester","phone":"9999999999","location":"Test Location","total_area_acres":3}'
```
(Assumes the user's own `npm run dev` is already running on port 3000, per this project's dev-server convention — do not start a second one.)
Expected: a `201`-shaped JSON response with the new farm object, no "Missing required fields" error, and `primary_crop` empty/absent in what's forwarded. Confirm with the user before running this against their real dev server if uncertain, since it does create a real row.

- [ ] **Step 6: Commit**

```bash
git add pages/api/farms/register.js
git commit -m "Stop requiring primary_crop in the farm registration proxy

Matches the removal of the Primary Crop input from the public form
(previous commit) - forwards an empty string to the Django backend
instead, which still accepts it since primary_crop is only required
to be present in the form data, not non-empty."
```

---

### Task 4: Frontend — remove the harvest section from the farm detail page

**Files:**
- Modify: `storefront_shopmekriha/pages/farms/[id].js:370` (meta description)
- Modify: `storefront_shopmekriha/pages/farms/[id].js:443-461` (meta grid — add certifications row)
- Modify: `storefront_shopmekriha/pages/farms/[id].js:543-559` (remove harvest block)
- Modify: `storefront_shopmekriha/pages/farms/[id].js:581-582` (rename heading)

**Interfaces:**
- Consumes: `farm.certifications` (array, already returned by `/api/farms` per `pages/api/farms.js`), `farm.district`, `farm.about`.
- Produces: no new interfaces for later tasks.

- [ ] **Step 1: Fix the meta description tag**

Change:
```javascript
        <meta name="description" content={`Explore ${farm?.name || ""} in ${farm?.district || ""}, Assam. Dynamic details about organic harvesting of ${farm?.harvest || ""}.`} />
```
to:
```javascript
        <meta name="description" content={`Explore ${farm?.name || ""} in ${farm?.district || ""}, Assam. ${farm?.about || ""}`} />
```

- [ ] **Step 2: Add a certifications row to the meta grid**

Change the meta grid (currently a 4-cell `grid-cols-2` block):
```javascript
            {/* Coordinates / Meta Grid */}
            <div className="grid grid-cols-2 gap-4 border border-gray-100 p-5 bg-white shadow-sm rounded-2xl mb-6 text-sm">
              <div>
                <span className="text-gray-400 block text-xs font-semibold uppercase tracking-wider mb-0.5">Farmer In Charge</span>
                <span className="font-semibold text-gray-800">{farm?.farmerName}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-semibold uppercase tracking-wider mb-0.5">Established</span>
                <span className="font-semibold text-gray-800">{farm?.established || "Not specified"}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-semibold uppercase tracking-wider mb-0.5">Land Size</span>
                <span className="font-semibold text-gray-800">{farm?.sizeAcres} Acres</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-semibold uppercase tracking-wider mb-0.5">Coordinates</span>
                <span className="font-semibold text-gray-800">{farm?.coordinates || "Not specified"}</span>
              </div>
            </div>
```
to (adds a full-width certifications row, only rendered when the farm has at least one certification):
```javascript
            {/* Coordinates / Meta Grid */}
            <div className="grid grid-cols-2 gap-4 border border-gray-100 p-5 bg-white shadow-sm rounded-2xl mb-6 text-sm">
              <div>
                <span className="text-gray-400 block text-xs font-semibold uppercase tracking-wider mb-0.5">Farmer In Charge</span>
                <span className="font-semibold text-gray-800">{farm?.farmerName}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-semibold uppercase tracking-wider mb-0.5">Established</span>
                <span className="font-semibold text-gray-800">{farm?.established || "Not specified"}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-semibold uppercase tracking-wider mb-0.5">Land Size</span>
                <span className="font-semibold text-gray-800">{farm?.sizeAcres} Acres</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-semibold uppercase tracking-wider mb-0.5">Coordinates</span>
                <span className="font-semibold text-gray-800">{farm?.coordinates || "Not specified"}</span>
              </div>
              {farm?.certifications?.length > 0 && (
                <div className="col-span-2 pt-3 border-t border-gray-100">
                  <span className="text-gray-400 block text-xs font-semibold uppercase tracking-wider mb-2">Certifications</span>
                  <div className="flex flex-wrap gap-2">
                    {farm.certifications.map((cert, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full uppercase tracking-wider"
                      >
                        ✓ {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
```

- [ ] **Step 3: Remove the "Active Organic Harvest" block entirely**

Delete this whole block (currently lines 543-559):
```javascript
            {/* Harvest Display */}
            <div className="border border-emerald-100 bg-emerald-50/50 p-6 rounded-2xl mb-6">
              <h2 className="text-xs uppercase font-bold text-emerald-800 mb-2 tracking-wider">🌾 Active Organic Harvest</h2>
              <p className="font-semibold text-lg text-emerald-900">
                {farm?.harvest}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {farm?.certifications?.map((cert, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-bold border border-emerald-200 bg-white text-emerald-800 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm"
                  >
                    ✓ {cert}
                  </span>
                ))}
              </div>
            </div>
```
The "About Narrative" block immediately above it and the "Book Farm Visit Button & Address" block immediately below it are untouched.

- [ ] **Step 4: Rename the product grid heading**

Change:
```javascript
              <h2 className={`${calSansHeading.className} text-2xl font-bold text-gray-900 tracking-tight mb-8`}>
                Crops Cultivated Here
              </h2>
```
to:
```javascript
              <h2 className={`${calSansHeading.className} text-2xl font-bold text-gray-900 tracking-tight mb-8`}>
                Products From This Farm
              </h2>
```

- [ ] **Step 5: Verify no leftover `farm?.harvest` references**

```bash
grep -n "farm?.harvest\|farm\.harvest" "pages/farms/[id].js"
```
Expected: no output. (`farm.harvest` may still exist as a field returned by `/api/farms` — that's fine, this only checks the page stopped *displaying* it.)

- [ ] **Step 6: Lint and build**

```bash
npm run lint
npm run build
```
Expected: both pass with no errors (matches the clean baseline from every prior frontend change this session).

- [ ] **Step 7: Manual verification**

With the user's own `npm run dev` running, visit `http://localhost:3000/farms/3` (or whichever farm ID currently has real data — "Rohdoi Organic Farm" per earlier verification this session) in the browser and confirm:
- No "🌾 Active Organic Harvest" section appears.
- If that farm has certifications, they now appear as badges inside the meta grid (Farmer/Established/Land Size/Coordinates box).
- The product grid heading reads "Products From This Farm".
- The product grid itself still lists the farm's real products exactly as before (unchanged).

- [ ] **Step 8: Commit**

```bash
git add "pages/farms/[id].js"
git commit -m "Remove single-crop harvest section from farm detail page

Replaced by the existing product grid below it, which already lists
real Product rows for the farm. Certifications (previously bundled
into the removed section) move into the farmer/established/land-size/
coordinates meta grid instead of being dropped. Also renames the
product grid heading from \"Crops Cultivated Here\" to \"Products From
This Farm\" - farms produce more than just crops."
```

---

### Task 5: Frontend — add a clickable farm badge to each product card on `/products`

**Files:**
- Modify: `storefront_shopmekriha/pages/products/index.js:316-393` (the product card mapping)

**Interfaces:**
- Consumes: `product.farm_name` and `product.farm_id` — both already present in the frontend's `/api/products` response (`farm_id` was already there; `farm_name` is new from Task 1, passed through unchanged by `pages/api/products.js`, which spreads all backend fields into its own response objects and does not need modification).

- [ ] **Step 1: Verify `farm_name` reaches this page unmodified by the proxy**

```bash
grep -n "farm_name" pages/api/products.js
```
Expected: no output — confirms `pages/api/products.js` doesn't already reference or strip a `farm_name` field, so it will pass through untouched from the backend response as part of the object spread already happening there (`...matchedStatic`/plain object returns already include every other backend field verbatim in the same way `farm_id` does).

- [ ] **Step 2: Restructure each card from one big `<Link>` to a `<div>` with two nested `<Link>`s**

Change the product card mapping (currently lines 316-393):
```javascript
              {filteredProducts.map((product) => {
                const isAvailable = product.availability_status === "available";
                return (
                  <Link
                    href={`/products/${product.id}`}
                    key={product.id}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      {/* Product Image */}
                      <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden border-b border-gray-50">
                        <Image
                          src={product.image1}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-103 transition-transform duration-500"
                          sizes="(max-w-768px) 100vw, 25vw"
                        />
                        {/* Availability tags */}
                        <div className="absolute top-3 right-3">
                          {isAvailable ? (
                            <span className="text-[9px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                              In Stock
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Text info */}
                      <div className="p-5 text-left">
                        {/* Primary Tag */}
                        <span className="text-[9px] font-bold text-[#005748] tracking-wider uppercase bg-[#005748]/5 px-2 py-0.5 rounded-sm">
                          {product.tags.split(",")[0].trim()}
                        </span>
                        
                        <h3 className={`font-sans font-bold text-gray-900 text-base mt-2.5 line-clamp-1 group-hover:text-[#005748] transition-colors ${fontClass}`}>
                          {product.name}
                        </h3>
                        
                        <p className={`text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed ${fontClass}`}>
                          {product.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Section */}
                    <div className="p-5 pt-0 flex flex-col gap-3">
                      <div className="border-t border-gray-50 pt-4 flex items-center justify-between text-xs mt-auto w-full">
                        {isAvailable ? (
                          <div className="flex flex-col items-start">
                            <div className="flex items-baseline gap-1">
                              <span className="font-extrabold text-[#005748] text-base">₹{product.discount_price}</span>
                              <span className="text-[10px] text-gray-400 line-through">₹{product.price}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">{t.unitLabel} {product.measure_of_unit}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold text-amber-700">{t.readyLabel}</span>
                            <span className="text-gray-900 font-semibold">{product.ready_by_timeline}</span>
                          </div>
                        )}

                        {/* Action text indicator */}
                        <span className={`text-[10px] font-bold tracking-wider uppercase border-b-2 border-transparent transition-all ${
                          isAvailable ? "text-[#005748] group-hover:border-[#005748]" : "text-amber-800 group-hover:border-amber-800"
                        } ${fontClass}`}>
                          {isAvailable ? t.btnBuy : t.btnRequest}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
```
to:
```javascript
              {filteredProducts.map((product) => {
                const isAvailable = product.availability_status === "available";
                return (
                  <div
                    key={product.id}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                  >
                    <Link href={`/products/${product.id}`} className="cursor-pointer">
                      {/* Product Image */}
                      <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden border-b border-gray-50">
                        <Image
                          src={product.image1}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-103 transition-transform duration-500"
                          sizes="(max-w-768px) 100vw, 25vw"
                        />
                        {/* Availability tags */}
                        <div className="absolute top-3 right-3">
                          {isAvailable ? (
                            <span className="text-[9px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                              In Stock
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Text info */}
                      <div className="p-5 pb-0 text-left">
                        {/* Primary Tag */}
                        <span className="text-[9px] font-bold text-[#005748] tracking-wider uppercase bg-[#005748]/5 px-2 py-0.5 rounded-sm">
                          {product.tags.split(",")[0].trim()}
                        </span>

                        <h3 className={`font-sans font-bold text-gray-900 text-base mt-2.5 line-clamp-1 group-hover:text-[#005748] transition-colors ${fontClass}`}>
                          {product.name}
                        </h3>

                        <p className={`text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed ${fontClass}`}>
                          {product.description}
                        </p>
                      </div>
                    </Link>

                    <div className="px-5">
                      {/* Farm badge - separate link so it navigates to the farm, not the product */}
                      {product.farm_name && (
                        <Link
                          href={`/farms/${product.farm_id}`}
                          className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition-colors"
                        >
                          🏡 {product.farm_name}
                        </Link>
                      )}
                    </div>

                    {/* Bottom Action Section */}
                    <Link href={`/products/${product.id}`} className="p-5 pt-3 flex flex-col gap-3 cursor-pointer">
                      <div className="border-t border-gray-50 pt-4 flex items-center justify-between text-xs mt-auto w-full">
                        {isAvailable ? (
                          <div className="flex flex-col items-start">
                            <div className="flex items-baseline gap-1">
                              <span className="font-extrabold text-[#005748] text-base">₹{product.discount_price}</span>
                              <span className="text-[10px] text-gray-400 line-through">₹{product.price}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">{t.unitLabel} {product.measure_of_unit}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold text-amber-700">{t.readyLabel}</span>
                            <span className="text-gray-900 font-semibold">{product.ready_by_timeline}</span>
                          </div>
                        )}

                        {/* Action text indicator */}
                        <span className={`text-[10px] font-bold tracking-wider uppercase border-b-2 border-transparent transition-all ${
                          isAvailable ? "text-[#005748] group-hover:border-[#005748]" : "text-amber-800 group-hover:border-amber-800"
                        } ${fontClass}`}>
                          {isAvailable ? t.btnBuy : t.btnRequest}
                        </span>
                      </div>
                    </Link>
                  </div>
                );
              })}
```

Note: the outer element changed from `<Link>` to `<div>` (Next.js `<Link>` renders an `<a>`, and nesting an `<a>` inside another `<a>` is invalid HTML and breaks click targeting) — the image/text area and the bottom action area are now each their own `<Link>` to the product, and the farm badge is a sibling `<Link>` to the farm, all still within one `group` div so the existing `group-hover:` Tailwind classes keep working exactly as before.

- [ ] **Step 3: Lint and build**

```bash
npm run lint
npm run build
```
Expected: both pass. If ESLint flags anything about `<a>` nesting or unescaped entities, address it before continuing — this project's lint config has caught similar issues in prior sessions.

- [ ] **Step 4: Manual verification**

With the user's own `npm run dev` running, visit `http://localhost:3000/products` and confirm:
- Every product card that has an associated farm (all of them, since `farm_id` is required on `Product`) shows a small "🏡 {farm name}" badge.
- Clicking the badge navigates to `/farms/{that farm's id}`, not the product page.
- Clicking anywhere else on the card (image, title, description, price/action row) still navigates to `/products/{id}` as before.
- Hover effects (image zoom, card lift, title color change) still work across the whole card, not just the parts still wrapped in `<Link>`.

- [ ] **Step 5: Commit**

```bash
git add pages/products/index.js
git commit -m "Add clickable farm badge to each product card on /products

Completes bidirectional farm<->product navigation: farm page already
listed its products, product detail page already linked back to its
farm, but the products list view had no way to jump to a product's
farm. Restructures each card from a single wrapping <Link> to a <div>
with two nested <Link>s (product area + farm badge), since nested <a>
tags are invalid HTML and Link renders an <a>."
```

---

## Post-implementation

Once all 5 tasks are committed:
- Backend: push the `shopmekrihabackend` branch and open a PR the same way as the three prior backend PRs this session (base `main`), noting in the PR body that this is purely additive (no migration) and stacks conceptually with the frontend PR.
- Frontend: push the `storefront_shopmekriha` branch and open a PR (base `main`), noting the backend PR it depends on (the `/products` farm badge won't show farm names until the backend PR is merged and deployed — `product.farm_name` will simply be `undefined` and the badge's `{product.farm_name \&\& (...)}` guard means it just won't render, not crash).

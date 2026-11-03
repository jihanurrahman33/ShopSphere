# ShopSphere

E-commerce frontend with a customer storefront and an admin dashboard.
Angular 22 (standalone, zoneless, signals) · Tailwind CSS v4 · JSON Server mock API.

## Run it

Needs Node 22.22.3+ / 24.15+ / 26+.

```bash
npm install
npm run api     # mock REST API  → http://localhost:3000
npm start       # Angular app    → http://localhost:4200
npm test        # unit tests (Vitest)
npm run build   # production build
```

Demo logins (mock data in `db.json`, local use only):

| Role     | Email                    | Password      |
| -------- | ------------------------ | ------------- |
| Admin    | admin@shopsphere.dev     | admin123      |
| Customer | customer@shopsphere.dev  | customer123   |

Coupon to try: `WELCOME10` (10% off, minimum 1000).

## Features

**Storefront** (`/store`): product list with search, category filter and sort · product details ·
cart with coupons and shipping · checkout · orders with tracking and printable invoice · account (profile, address book) ·
wishlist · product photos gallery and reviews · register/login.

**Admin** (`/admin`, admin role): dashboard (revenue comparison, 7-day sales, recent orders, top sellers) ·
products (create/edit, search, pagination) · categories · orders (status workflow) · inventory (stock adjustments + history) ·
customers · coupons · reports (daily/monthly sales, top products, category sales, CSV export).

## Architecture

```
src/app/
├── core/         models, repositories, facades, strategies, factories, domain rules, services, guards, interceptors
├── shared/       reusable presentational components (product card, status badge, pagination)
├── layouts/      store-layout, admin-layout
└── features/     storefront/, admin/, auth/  (lazy-loaded routes)
```

Data flow: component → service/facade → repository → `HttpClient` → JSON Server.
Components never call `HttpClient` directly.

### Design patterns

| Pattern                | Where                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| Repository             | `core/repositories` (generic `BaseRepository<T>` + per-resource)   |
| Facade                 | `CartFacade`, `WishlistFacade`                                     |
| Strategy               | `core/strategies` (discount types, shipping)                       |
| Factory                | `core/factories/order.factory.ts` (order with price/name snapshot) |
| Observer               | signals / `computed` / `rxResource` throughout                     |
| Interceptor chain      | `authInterceptor` → `errorInterceptor`                             |

SOLID in practice: small single-purpose services (S), new coupon types / admin menu items added without editing
callers (O), repositories and strategies behind narrow interfaces (L/I), API URL injected via `API_BASE_URL` token (D).
Business rules (order workflow, coupon rules, stock, reports) are pure functions in `core/domain` with unit tests.

## Demo data and photo credits

`db.json` has 12 sample products in 4 categories (prices in BDT). Photos are loaded from
[Unsplash](https://unsplash.com) under the [Unsplash License](https://unsplash.com/license), so the demo needs internet
access to show them. Photographers: Luke Peterson (headphones), Roy Wen (keyboard), Auguras Pipiras (smartwatch),
Nejc Soklič (speaker), Haryo Setyadi (t-shirt), Caio Coelho (denim jacket), Irene Kredenets (sneakers),
Wiser by the Mile (backpack), Mediamodifier (mug), Jean-Philippe Delberghe (desk lamp), Tuaans (yoga mat),
quokkabottles (water bottle). Product names, descriptions, prices and stock are invented.
The sneakers are out of stock and the smartwatch and water bottle are low on stock, to demo those states.

## Known limits (mock backend)

- Auth, route guards, stock checks, coupon limits and order totals run in the browser. **They are UX only**;
  a real backend must enforce them (and store hashed passwords).
- `db.json` stores demo passwords in plain text. Never reuse them.
- Stock/coupon/ledger updates are separate requests and are not atomic.
- Product images are URLs (no upload backend). Reviews and ratings are open to any signed-in user, one per product.
- Not built yet: product variants (size/colour), real payments, file upload, deployment config.


# Admin Panel Plan

Ek dedicated `/admin` section banayenge jo same app ke andar hi hoga (alag deployment nahi), lekin sirf `admin` role wale users hi access kar sakte. Same Lovable Cloud backend use hoga — koi duplicate database nahi.

## 1. Roles & Security foundation

- `app_role` enum: `admin`, `user`
- `user_roles` table (user_id, role) — profiles se alag (security best practice)
- `has_role(uid, role)` security-definer function — RLS me use hoga (recursion avoid)
- Aapke account ko manually `admin` role assign karenge (aap email/user_id share karoge)
- Har existing table (profiles, skin_scans, reminders) me admin-read RLS policy add hogi: `USING (has_role(auth.uid(), 'admin'))`

## 2. Naye Database Tables

Existing use hote hue: `profiles`, `skin_scans`, `reminders`, `reminder_logs`.

Naye tables:
- **products** — id, name, brand, category, price, image_url, ingredients, description, stock, active
- **articles** — id, slug, title, cover_image, content (markdown), category, author_id, published, published_at
- **experts** — id, name, specialty, bio, avatar_url, credentials, contact, active
- **coupons** — code, discount_type (percent/flat), discount_value, min_order, expires_at, usage_limit, used_count, active
- **orders** — id, user_id, items (jsonb), subtotal, discount, total, coupon_code, status (pending/paid/shipped/delivered/cancelled), address (jsonb), created_at
- **audit_log** — admin actions trail (who/what/when)

Sab tables pe RLS + admin-full-access + user-read-own policies.

## 3. Admin Routes (protected)

Structure: `src/routes/_authenticated/admin/`

Layout: `admin/route.tsx` — `beforeLoad` me `has_role` check; non-admin → redirect `/dashboard`. Sidebar layout (shadcn Sidebar) with nav.

Pages:

```text
/admin                        → Dashboard  (KPI cards: users, scans today, orders, revenue)
/admin/users                  → User Management (list, search, view profile, disable, assign role)
/admin/products               → Product Management (CRUD + image upload)
/admin/reports                → AI Reports (all skin_scans, filter by concern/score, view detail)
/admin/articles               → Article Management (CRUD, markdown editor, publish toggle)
/admin/experts                → Expert Management (CRUD)
/admin/coupons                → Coupons (CRUD, usage stats)
/admin/orders                 → Orders (list, status update, detail view)
/admin/revenue                → Revenue (daily/weekly/monthly totals, charts)
/admin/analytics              → Analytics (signups trend, scan volume, top concerns, funnel)
```

Har page server functions use karega (`requireSupabaseAuth` + role check inside handler).

## 4. App-side Integration

Admin-managed content app me automatically dikhega:
- `products` → Shop pages (currently static → DB se aayega)
- `articles` → Tips article pages
- `experts` → Tips experts pages
- `coupons` → Shop checkout me apply
- `orders` → user ka order history

Yani admin ek jagah edit karega, user side turant reflect hoga.

## 5. Admin UI

- Left sidebar (collapsible) with 10 nav items
- Top bar: search, admin avatar, sign-out
- Data tables with sort/filter/pagination (shadcn Table)
- Modals/sheets for create/edit forms
- Charts via `recharts` (already available)
- Confirmation dialogs for destructive actions

## 6. Delivery Order (phased)

Itna scope ek turn me ship karna risky hai. Recommended phases:

- **Phase 1** (foundation): roles migration, admin layout + route guard, empty admin dashboard shell with sidebar. → verify aap login karke `/admin` access kar pao.
- **Phase 2**: User Management + AI Reports (existing data pe kaam karta hai, koi naya table nahi).
- **Phase 3**: Products + Orders + Coupons tables + admin CRUD pages + Shop app-side wiring.
- **Phase 4**: Articles + Experts tables + admin CRUD + Tips app-side wiring.
- **Phase 5**: Revenue + Analytics charts.

---

## Questions before I start Phase 1

1. **Admin assign** — apna signup email batao (ya user_id), taaki migration me aapko admin bana dun.
2. **Existing shop/tips/experts data** — abhi hardcoded hai (`src/lib/*.ts`). Migrate karke DB me daalu (ek baar seed), ya fresh start karen aur aap admin se add karoge?
3. **Phased delivery OK hai?** Main Phase 1 se shuru karta hun, aap verify karke next phase bolna. Ya aap poori chiz ek saath chahte ho (bada change, testing tough)?

Aapke jawab ke baad Phase 1 build karta hun.

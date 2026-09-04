# API 設計（Laravel 12）

- ベースパス `/api`
- レスポンスは JSON。一覧は `{ "data": [...] }`、単体は `{ "data": {...} }`
- 認証は Sanctum のパーソナルアクセストークン（`Authorization: Bearer <token>`）
- ブラウザは直接叩かない。Next.js のサーバー側からのみ呼ぶ（BFF）
- バリデーションエラーは 422 `{ "message": "...", "errors": { "field": ["..."] } }`
- 金額はすべて整数（JPY 税込）

## 公開エンドポイント

### GET /api/categories
```json
{ "data": [
  { "id": 1, "name": "Tops", "slug": "tops" },
  { "id": 2, "name": "Bottoms", "slug": "bottoms" },
  { "id": 3, "name": "Outerwear", "slug": "outerwear" },
  { "id": 4, "name": "Accessories", "slug": "accessories" }
] }
```

### GET /api/products
クエリ:
- `category` … カテゴリ slug（任意）
- `new` … `true` で作成30日以内・新着順（トップ用）
- `limit` … 件数上限（任意）

`is_published = true` のみ。カード表示に必要な項目のみ返す。

```json
{ "data": [
  { "id": 10, "name": "Boxy Cotton T-Shirt", "slug": "boxy-cotton-t-shirt",
    "price": 12000,
    "category": { "name": "Tops", "slug": "tops" },
    "stock_status": "in_stock",         // in_stock | low_stock | sold_out（全variant合算）
    "is_new": true,                      // created_at が30日以内
    "images": [
      { "url": "/media/products/10/01J8A.jpg", "alt": "...", "position": 0 },
      { "url": "/media/products/10/01J8B.jpg", "alt": "...", "position": 1 }
    ] }
] }
```

### GET /api/products/{slug}
詳細。未公開・存在しない slug は 404。

```json
{ "data": {
  "id": 10, "name": "Boxy Cotton T-Shirt", "slug": "boxy-cotton-t-shirt",
  "price": 12000,
  "category": { "name": "Tops", "slug": "tops" },
  "description": "...",
  "material": "本体 綿100% / 刺繍糸 ポリエステル100%",
  "care": "...",
  "origin": "中国",
  "product_code": "EC-TP0012",
  "size_chart": {
    "unit": "cm",
    "columns": ["着丈","身幅","肩幅","袖丈"],
    "rows": { "S": [66,52,46,20], "M": [68,55,48,21], "L": [70,58,50,22] }
  },
  "is_new": true,
  "images": [ { "url": "...", "alt": "...", "position": 0 }, ... ],
  "colors": ["Black", "Ecru"],              // color が入っている variant があれば。無ければ []
  "variants": [
    { "id": 55, "size": "S", "color": null, "stock": 8,  "stock_status": "in_stock" },
    { "id": 56, "size": "M", "color": null, "stock": 2,  "stock_status": "low_stock" },
    { "id": 57, "size": "L", "color": null, "stock": 0,  "stock_status": "sold_out" }
  ],
  "related": [ /* 同カテゴリの他の公開商品を position 順に全件、一覧と同じ要約形式 */ ]
} }
```

`stock_status` 閾値: `0`→`sold_out` / `1..3`→`low_stock` / `>=4`→`in_stock`（`config('shop.low_stock_threshold', 3)`）。

## 認証エンドポイント

### POST /api/register
body: `name`, `email`, `password`, `password_confirmation`
→ 201 `{ "data": { user }, "token": "<plain-text-token>" }`

### POST /api/login
body: `email`, `password`
→ 200 `{ "data": { user }, "token": "..." }` / 失敗 422

### POST /api/logout （要認証）
現在のトークンを失効 → 204

### GET /api/me （要認証）
→ `{ "data": { id, name, email, role } }`（`role` は `customer` / `admin`）

### PUT /api/me （要認証）
body: `name`, `email` → 更新後の user

### PUT /api/me/password （要認証）
body: `current_password`, `password`, `password_confirmation` → 204

## 住所録（要認証、本人のもののみ）

| メソッド | パス | 備考 |
|---|---|---|
| GET | `/api/addresses` | 一覧（is_default を先頭） |
| POST | `/api/addresses` | 作成。`is_default=true` なら他を false 化 |
| PUT | `/api/addresses/{id}` | 更新 |
| DELETE | `/api/addresses/{id}` | 削除 |
| POST | `/api/addresses/{id}/default` | デフォルト設定 |

address body: `recipient_name`, `postal_code`, `prefecture`, `city`, `address_line1`, `address_line2?`, `phone`, `is_default?`

## 注文（要認証）

### POST /api/orders
```json
{
  "items": [ { "variant_id": 55, "quantity": 2 } ],
  "address_id": 3,
  "address": null,
  "save_address": false
}
```
- `address_id` か `address`（新規オブジェクト）のどちらか必須
- 金額はサーバーで再計算。`docs/02` の注文作成トランザクション参照
- → 201 `{ "data": { order } }`（order_items 含む）
- 在庫不足 → 422 `{ "message": "...", "errors": { "items": [...] }, "unavailable": [ { "variant_id": 55, "available": 1 } ] }`

### GET /api/orders （要認証）
本人の注文一覧（新しい順）。要約（number / created_at / item_count / total / status）。

### GET /api/orders/{order_number} （要認証）
本人の注文詳細。他人の注文は 404。

## 管理 API（`/api/admin/*`）

`auth:sanctum` ＋ admin 限定。エンドポイント一覧は `docs/05-admin.md` を参照。

## Next.js 側の Route Handler（BFF）

ブラウザはこちらを叩く。`/app/api/**` または Server Action。

| ブラウザ向け | 内部で呼ぶ Laravel |
|---|---|
| `POST /bff/login` | `POST /api/login` → token を httpOnly Cookie にセット |
| `POST /bff/register` | `POST /api/register` → 同上 |
| `POST /bff/logout` | `POST /api/logout` → Cookie 削除 |
| `GET /bff/me` | `GET /api/me` |
| 商品・カテゴリ系 | Server Component から直接 `fetch(API_URL + ...)`（Cookie 不要） |
| 住所・注文・プロフィール系 | Route Handler が Cookie のトークンを付けて Laravel へ中継 |

Cookie 名: `ec_token` / `httpOnly` / `secure`(本番) / `sameSite=lax` / 有効期限 30日

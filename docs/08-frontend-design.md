# フロントエンド設計（Next.js 15 / App Router）

土台は `docs/00`（スタック）・`docs/01`（サイトマップ／各ページの中身）・`docs/03`（API とブラウザ向け BFF ルートの対応表）。ここは「フロントをどう組むか」に絞る。

**R1（ec1）からの改善点**: ec1 は規約（型・zod・データ取得関数の置き場所）を実装が進んでから後付けしようとして「移行中」のまま終わった。R2 は最初からその形で書く。

---

## 1. アーキテクチャ（BFF のフロント視点）

ブラウザは Next.js だけと通信する。Laravel を直接叩かない。

| データ | 経路 | 実装 |
|---|---|---|
| 読み取り（商品・カテゴリ） | Server Component → `lib/<domain>.ts` → `apiFetch`（サーバー専用）→ Laravel | Cookie 不要。SSR で HTML に埋める |
| 書き込み・個人化（認証・注文・住所・プロフィール） | ブラウザ（Client Component）→ `fetch('/bff/...')` → Route Handler（`app/bff/**/route.ts`）→ `lib/<domain>.ts` が httpOnly Cookie のトークンを付けて Laravel | Route Handler は薄く保ち、実処理は `lib/` |

```
ブラウザ
  ├─ (Server Component)  ──→ apiFetch ──────────────→ Laravel  （商品・カテゴリ）
  └─ fetch('/bff/x')  ──→ app/bff/x/route.ts ──→ Laravel  （認証・注文・住所・プロフィール）
                              └ Cookie の ec_token を Bearer に載せ替える
```

---

## 2. ディレクトリ構成

```
frontend/
├── middleware.ts                 # /account /checkout の未ログインガード
├── app/
│   ├── layout.tsx                # <html><body> のシェルだけ（フォント・globals）
│   ├── globals.css               # Tailwind + デザイントークン
│   ├── (shop)/                   # ストアフロント。Header/Footer 付き共通レイアウト
│   │   ├── layout.tsx            #   <Header/> {children} <Footer/>
│   │   ├── not-found.tsx
│   │   ├── (catalog)/            #   URL には出ないグループ分け（整理目的のみ）
│   │   │   ├── page.tsx          #     /  トップ
│   │   │   └── products/[slug]/page.tsx
│   │   ├── (cart)/
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   └── checkout/complete/page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── (account)/
│   │       └── account/…         #   ダッシュボード / orders / addresses / profile
│   ├── admin/                    # 管理画面。独自レイアウト（後のフェーズ）
│   └── bff/                      # Route Handler 群（ブラウザが叩く。レイアウト無し）
│       ├── login/route.ts  register/route.ts  logout/route.ts
│       ├── me/route.ts  me/password/route.ts
│       ├── addresses/route.ts  addresses/[id]/route.ts  addresses/[id]/default/route.ts
│       └── orders/route.ts
├── components/
│   ├── layout/     Header, Footer, CartCount, AccountLink, NewsletterForm
│   ├── home/       Hero, BrandConcept, Lookbook, CategoryGrid, AboutSection
│   ├── product/    ProductCard, ProductMedia, Gallery, VariantSelector, Accordion, SizeChartTable
│   ├── cart/       CartLine, CartSummary
│   ├── checkout/   AddressPicker, AddressForm, OrderReview
│   ├── account/    OrderList, AddressBook, ProfileForm, PasswordForm, LogoutButton
│   ├── auth/       LoginForm, RegisterForm
│   ├── ui/         Button, Field, Badge, Toast …（装飾の薄いプリミティブ）
│   └── providers/  CartHydration, QueryProvider
└── lib/
    ├── api.ts          # apiFetch（サーバー専用）／ApiError／apiErrorResponse
    ├── types.ts        # Laravel Resource と 1:1 の型。全部ここ
    ├── constants.ts    # SESSION_COOKIE_NAME, 送料しきい値（表示用）など
    ├── products.ts categories.ts auth.ts addresses.ts orders.ts   # ドメイン別データ取得関数
    ├── schemas/        # zod スキーマ 1フォーム1ファイル
    ├── stores/cart.ts  # zustand（persist）
    └── hooks/          # useCartValidation など
```

**規約**: `.tsx` は JSX を返す関数だけにする。`apiFetch` を呼ぶだけの関数・型定義・zod スキーマは `.tsx` に直書きせず `lib/` に置く。

---

## 3. データ取得

### 3.1 読み取り（商品・カテゴリ）

- Server Component が `lib/products.ts` / `lib/categories.ts` の関数を呼ぶ。関数の中で `apiFetch`（`API_URL` を読むサーバー専用）。
- `@tanstack/react-query` は使わない（サーバーで取って表示するだけなので）。
- キャッシュ: `apiFetch` は既定 `no-store`。カタログの読み取りだけ `next: { tags: [...] }` を付けてオンデマンド `revalidateTag()` できるようにする（実際の revalidate 発火は管理画面の商品更新を作るフェーズで）。

### 3.2 書き込み・個人化（認証・注文・住所・プロフィール）

- Client Component が `fetch('/bff/...')` を叩く。`app/bff/**/route.ts` が Cookie のトークンを取り出して `lib/<domain>.ts` の関数に渡し、そこで `Authorization: Bearer` を付けて Laravel へ。
- Route Handler 本体は「body を読む → lib の関数を呼ぶ → Cookie 操作 → JSON を返す」だけの数行。
- `@tanstack/react-query` を使うのは **クライアント主体の読み書きで、キャッシュ共有や複雑な状態管理が要るもの**（ログイン状態の `AccountLink`、カートの在庫再検証、後の `/admin` テーブル）。`/account` の住所録 CRUD のように「一覧が他画面と共有されず、成功後に丸ごと取り直せば済む」ものは、ローカル state + 手書き `fetch` の方がシンプルで、そちらを使う。

### 3.3 Laravel の 422 をフォームに出す

BFF は Laravel の `{ message, errors: { field: ["..."] } }` をそのまま同じステータスでブラウザに中継する（`lib/api.ts` の `apiErrorResponse`）。フォーム側は `errors` を react-hook-form の `setError` にマッピングしてフィールド下に表示する。

---

## 4. 認証

- トークンは **httpOnly Cookie `ec_token`**（`secure` は本番のみ / `sameSite=lax` / `path=/` / 30日）。ブラウザの JS からは触れない。
- Cookie 名は `lib/constants.ts` の `SESSION_COOKIE_NAME`（`middleware.ts`（Edge）と `lib/auth.ts`（Node）の両方から参照するので依存の少ない単独ファイルに置く）。
- `lib/auth.ts`（サーバー専用）: `getSessionToken()` / `setSessionCookie(res, token)` / `clearSessionCookie(res)` ＋ `loginUser` `registerUser` `logoutUser` `fetchCurrentUser` `updateProfile` `updatePassword`。
- `middleware.ts`: `/account/*` `/checkout/*` は **Cookie の有無だけ**を見る軽量チェック。無ければ `/login?redirect=<元パス>` へ。トークンの有効性そのものは各 Route Handler / Server Component が Laravel 呼び出し時に検証する。
- `/admin/*` は `role === 'admin'` の確認が要るので middleware の matcher には入れない（`/bff/me` を引く別のガードを管理フェーズで作る。docs/05）。

---

## 5. カート

- `lib/stores/cart.ts` … zustand + `persist`（localStorage キー `ec2-cart`）。**サーバーには一切送らない**。ログイン状態と無関係にブラウザ単位。
- `persist` は `skipHydration: true`。`components/providers/CartHydration.tsx` がマウント後に `rehydrate()` を呼ぶ（SSR は必ず `items: []` で描画されるので、自動復元だと hydration mismatch になる）。
- カートに持つのは「追加時点の表示スナップショット」（`variantId` / `productSlug` / `productName` / `size` / `color` / `unitPrice` / `quantity` / `imageUrl`）。`/cart` と `/checkout` の表示時に API で商品・在庫・価格を**再検証**する（売り切れ・価格変動を反映）。
- 確定金額は `POST /api/orders` でサーバーが再計算するので、フロントの金額表示がズレても実害はない。
- ヘッダーの `CART (n)` は行数ではなく**数量合計**。

---

## 6. 型（`lib/types.ts`）

- `backend/app/Http/Resources/*` と 1:1 に対応させる。Resource を変えたらここも直す（コメントで対応する Resource ファイル名を書く）。
- `ApiResource<T> = { data: T }` / `ApiCollection<T> = { data: T[] }`。
- 1つの関数専用の入力型（`LoginPayload` など）も含めて**全部ここ**。`.ts` / `.tsx` 内に `type X = {...}` を直書きしない。
- `StockStatus` / `OrderStatus` は `backend/app/Enums/*` の値と一致させる。

---

## 7. バリデーション（`lib/schemas/`）

- 1フォーム 1ファイル（`login.ts` / `register.ts` / `profile.ts` / `password.ts` / `address.ts` / `checkout.ts`）。
- コンポーネント内に `const schema = z.object({...})` を直書きしない。
- クライアント zod はあくまで UX（送信前に気づかせる）。最終防衛は Laravel の FormRequest。ルール（必須・桁・`123-4567` 形式など）はバックエンドと揃える。

---

## 8. スタイル

- Tailwind v4 の CSS-first。`globals.css` にトークンを定義し、配色は **4色のみ**に固定:
  - `--color-ink` `#000` / `--color-paper` `#fff` / `--color-mist` `#f4f4f4` / `--color-graphite` `#767676`
- **ダークモードは持たない**（ブランドの統一されたモノトーンを崩さない。Balenciaga 系ミニマルサイトの慣習）。`app/layout.tsx` のスキャフォールド（`dark:` クラス・`Geist_Mono` の未使用分など）は掃除する。
- 全大文字・字間広め（tracking）・極端な余白・区切りは原則ボーダー（**影を使わない**）。
- フォントは Geist Sans（スキャフォールド既定を流用）。等幅は使わないので `Geist_Mono` は外す。
- アニメーションは `opacity` と画像差し替えのみ。

---

## 9. 画像と「NO IMAGE」

- R2 の商品シードは画像を持たない（`docs/rebuild-log` Step 10）。`components/product/ProductMedia.tsx` を用意し:
  - `images[0]` があれば `next/image` で表示、無ければ `bg-mist` のボックスに `NO IMAGE`（`text-graphite`・全大文字・字間広め）を中央表示。
  - 一覧カードのホバー差し替えは `images[1]` がある時だけ。
- 画像の実体配信（`/media/[...key]` プロキシ + `next/image` loader）は管理画面・画像アップロードのフェーズで作る。それまでは全商品 NO IMAGE。

---

## 10. エラー・ローディング・空状態

- ルートセグメントごとに `loading.tsx`（スケルトン）／`error.tsx`（リトライ）／`not-found.tsx`。商品詳細の 404 は `notFound()` を呼ぶ。
- 空状態の文言は `docs/01` 準拠（`YOUR CART IS EMPTY` ＋ `CONTINUE SHOPPING` など）。
- フッターのニュースレターは送信でトースト表示のみ（ダミー）。

---

## 11. 環境変数

| 変数 | スコープ | 用途 |
|---|---|---|
| `API_URL` | サーバー専用 | `apiFetch` の向き先。ローカル `http://backend:8080` |
| `NEXT_PUBLIC_SITE_URL` | クライアント可 | 絶対 URL 生成。ローカル `http://localhost:3000` |
| `BUCKET_*`（ENDPOINT / ACCESS_KEY_ID / SECRET_ACCESS_KEY / NAME / REGION） | サーバー専用 | `/media` プロキシの GetObject（画像フェーズで使用） |

`NEXT_PUBLIC_` の付かない変数はブラウザに渡らない。`lib/api.ts` など「サーバー専用」ファイルをクライアントから import しない。

---

## 12. 実装の順序（フロント Step）

1. **共通レイアウト**: `app/layout.tsx` 掃除 ＋ `globals.css` トークン ＋ `(shop)/layout.tsx`（Header / Footer）＋ `lib/types.ts` 初版 ＋ `lib/constants.ts`
2. **トップページ**: `(shop)/page.tsx` — Hero / BrandConcept / Lookbook / カテゴリ別グリッド / AboutSection ＋ `ProductCard` ＋ `ProductMedia`（NO IMAGE）。`lib/products.ts` `lib/categories.ts`
3. **商品詳細** `(shop)/products/[slug]`: Gallery / VariantSelector / Accordion / SizeChartTable / related。`notFound()`
4. **カート** `(shop)/cart`: `lib/stores/cart.ts` / `CartHydration` / 在庫再検証（`useCartValidation`）
5. **認証** `(shop)/login` `(shop)/register` ＋ `app/bff/{login,register,logout}` ＋ `lib/auth.ts` ＋ `middleware.ts`
6. **マイページ** `(shop)/account/*` ＋ `app/bff/{me,me/password,addresses,orders}` ＋ `lib/{addresses,orders}.ts`
7. **チェックアウト** `(shop)/checkout` `(shop)/checkout/complete`
8. **仕上げ**: `loading/error/not-found`、ニュースレターのトースト、レスポンシブ確認

管理画面（`app/admin/*`）はバックエンドの管理 API と合わせて別フェーズ。

# 作り直しログ

ポートフォリオとして3〜4回作り直す。各回の狙い・変更点・反省をここに記録する。

- R1 の記録: `../../ec1/docs/rebuild-log.md`

---

## R2 — 2026-09-03 開始

**狙い**: R1 と同一スタック・同一スコープで作り直し、実装の質と設計の一貫性を上げる。機能追加はしない（決済・検索・お気に入り・レビューは引き続き対象外）。

**スタック**: Next.js 15 (App Router) + Laravel 12 API + PostgreSQL 16 + Docker / Railway（R1 と同一）

**スコープ**（R1 と同一）
- 商品閲覧: カテゴリ（フラット4つ）→ トップページ内のカテゴリセクション → 商品詳細
- カート（Zustand + localStorage）
- 会員登録・ログイン（Sanctum トークン + Next.js httpOnly Cookie）
- チェックアウト（配送先入力 → `orders` を `pending` で作成、決済なし）
- マイページ: 注文履歴 / 住所録 CRUD / プロフィール編集
- ブランド紹介（`/` トップページ内のセクション、独立ページなし）
- 管理者ページ（Next.js 自作 `/admin`）: 商品・カテゴリ・注文・会員の管理、ダッシュボード

**商品構成**: ユニセックス。性別区別なし。カテゴリは Tops / Bottoms / Outerwear / Accessories の4フラット、各 3〜6 点。画像はユーザー提供。

**デザイン**: Balenciaga 公式の配色・タイポ ＋ yz-store.com/collections/9090 のページ構成。

### R1 から引き継ぐ設計上の決定事項（R2 の出発点。変更なし）

- 性別（MEN/WOMEN）で分けない。カテゴリはフラット。ルートは `/collections/[category]`（ただしカテゴリ別一覧ページ・全商品一覧ページは作らず、トップページのカテゴリセクションで全商品を出し切る）
- バリアントUIはサイズセレクタ＋単一 `ADD TO CART`（色展開する商品のみ色スウォッチ追加）
- 商品詳細に size_chart(jsonb) / material / care / origin / product_code を持たせる
- サイズは S / M / L の3つのみ（アクセサリーは FREE 単一）。モデル着用情報は無し
- 管理者ページは Next.js に自作。Laravel に `/api/admin/*`、`users.role` で認可
- 商品画像は Railway バケット（private・S3互換）。public 非対応のため Next.js `/media/[...key]` プロキシで配信。ローカルは MinIO
- 在庫ステータスは 0=SOLD OUT / 1〜3=LOW STOCK / 4+=在庫あり（閾値 config）
- カートはサーバー保持せずフロントのみ（`POST /api/orders` で一括送信）
- 認証は BFF。Laravel は Railway 内部ネットワークのみ、公開しない
- 住所は注文時にスナップショットコピー
- 送料: 一律 ¥800、¥20,000 以上で無料
- お気に入り・検索は作らない
- キュー / Redis は入れない（`CACHE_STORE=database` / `QUEUE_CONNECTION=sync`）
- Laravel 設計方針: 薄い Controller ＋ Action（1ユースケース1クラス、`execute()`）。Service は外部システムのラッパー（`StorageService`）のみ。Repository パターン不採用。詳細は `docs/06-laravel-design.md`
- ヘッダーはロゴ＋ACCOUNT/CART のみ。ナビ・検索なし。常に白背景・下ボーダー固定
- `/about` は独立ページを持たず `/` トップページ内のセクションに統合
- トップページの `BrandConcept`（理念）と `AboutSection`（沿革・素材・製造背景）は役割を分離する
- categories の初期4件は当初「管理画面（`/admin`）から手動作成」方針だったが、商品 Seeder が category を必須とするため **`CategorySeeder` で作成に変更**（2026-09-04、Step 10）。admin のカテゴリ管理は「4件を編集・並べ替え・5件目追加」で動作確認する

### R2 での新しい決定（R1 から変更）

- **ローカル開発環境を全面 Docker 化**（2026-09-03 決定）。R1 は「ミドルウェアだけ compose、frontend/backend はホストで `php artisan serve` / `npm run dev`」だったが、R2 は `docker compose up -d` だけで frontend / backend / db / minio が全部立ち上がる形にする。ホストに PHP / Node / Composer を入れない。
  - **理由**: `php artisan serve` を毎回手で打つのが面倒。環境差をなくす。Docker Compose 構成そのものをポートフォリオの見せ場にする。
  - frontend もコンテナ内で `next dev`（ソースをバインドマウント、`node_modules` は名前付きボリューム、Mac 対策で polling 有効化）。
  - artisan / composer / npm / pint / test は `docker compose exec` 経由。Laravel Boost の MCP 起動も `docker compose exec -T php php artisan boost:mcp` に変更。
  - 詳細は `docs/07-local-dev.md`。

- **backend のアプリサーバーを FrankenPHP / Octane から nginx + php-fpm に変更**（2026-09-03 決定）。ローカルも本番も同一イメージ `serversideup/php:8.4-fpm-nginx` を使う。
  - **理由**: Octane はワーカー常駐で状態リークの考慮が要るが、この規模では性能メリットより落とし穴のほうが大きい。nginx + php-fpm の定番構成に寄せる。
  - **自前 Dockerfile（fpm + nginx + supervisord 手書き）ではなく `serversideup/php` を採用**（2026-09-03 決定）。理由: nginx.conf / php-fpm.conf / supervisord.conf を保守しなくて済む、opcache・php-fpm チューニング・非root・healthcheck・s6 での PID1 シグナル処理が最初から入っている、`pdo_pgsql` など基本拡張は同梱（`intl` / `gd` は非同梱だが R2 では未使用）、`AUTORUN_*` env で起動時 migrate / config:cache を宣言的に指定できる。デメリット（nginx 設定を手で書く経験は積めない）より、枯れたベースイメージを正しく使う方が実務的と判断。
  - ローカル: compose の `image:` で serversideup を直接指定し `./backend` をマウント（コンテナ1つ。nginx も同梱）。`AUTORUN_ENABLED=false` で artisan は手動。
  - 本番（Railway）: `FROM serversideup/php:8.4-fpm-nginx` の薄い Dockerfile でコードを COPY + `composer install --no-dev`。migrate 等は `AUTORUN_*` env に任せる。リッスンポートは 8080。
  - R1 の `docs/04` にあった FrankenPHP Dockerfile 方針・`octane:frankenphp` 起動は破棄。`docs/04` / `docs/07` を serversideup ベースに書き換え済み。

### R2 で見直したいこと（R1 振り返りより。着手時に反映）

- フロント: 型を `lib/types.ts`、zod スキーマを `lib/schemas/` に集約する方針を最初から徹底（R1 では途中から移行）
- フロント: データ取得関数（`apiFetch` を呼ぶだけの関数）は `.tsx` に直書きせず `lib/` に切り出す（`lib/products.ts` / `lib/categories.ts` など）
- `/admin` フロント・`/media` プロキシ・商品シーダー（画像込み）・本番 Docker / Railway デプロイまで R1 では未完だったので R2 で完走する
- テスト（Feature 中心 + 純粋ロジックの Unit）を機能実装と並行して書く

**R3 以降に回すもの**（R1 と同じ）
- Stripe 決済（orders に `paid` ステータス追加）
- お気に入り、検索、レビュー、在庫のリアルタイム反映
- 注文ステータス遷移（shipped 等）
- 管理画面のリッチ化（画像の一括アップロード、CSV インポート、権限の細分化）

### 実装ログ

**Step 1 — 2026-09-04 リポジトリ骨組み**
- `git init`（ブランチ `main`）。remote `origin` = `github.com/kabochan73/ec2`（push はユーザーが実施）
- ルート設定: `.gitignore` / `.editorconfig`（2スペース、PHP のみ4）/ `.nvmrc`（Node 22）/ `README.md`
- コミットは docs と骨組みで分割（`docs: 設計ドキュメント一式（R2）` / `chore: リポジトリ骨組み`）
- 方針: 1コミット＝小さい単位で刻む（学習目的）。push はユーザー、コミットまでが Claude

**Step 2 — 2026-09-04 ローカルインフラ（db + minio）**
- `docker-compose.yml`: db（postgres:16-alpine）/ minio（S3互換）/ createbuckets（`ec2-media` を自動作成する使い捨て）
- backend / frontend はまだ入れない（Step 3 以降で serversideup/php・next dev を追加）
- 確認済み: `docker compose up -d` で db・minio が healthy、`pg_isready` OK、`ec2-media` バケット作成成功（private）

**Step 3 — 2026-09-04 backend（Laravel 12）+ Postgres 疎通**
- `composer create-project laravel/laravel:^12`（使い捨て `composer:2` コンテナ）→ `backend/`（framework v12.69.1）
- `docker-compose.yml` に `backend` サービス追加（`serversideup/php:8.4-fpm-nginx` を直接使用、`./backend` マウント、`SSL_MODE=off` / `PHP_OPCACHE_ENABLE=0` / `AUTORUN_ENABLED=false`、ホスト 8000→コンテナ 8080）
- `backend/.env`（と `.env.example`）を Postgres コンテナに接続（`DB_CONNECTION=pgsql` / `DB_HOST=db`）。`APP_NAME=EC-PORTFOLIO` / `APP_URL=http://localhost:8000`
- `php artisan install:api` で Sanctum v4 導入、`routes/api.php` 生成、`bootstrap/app.php` に api ルート登録。`User` に `HasApiTokens` トレイト追加
- `install:api` の migrate が Postgres に対して成功（users / cache / jobs / personal_access_tokens など10テーブル）→ DB 疎通確認
- `GET /api/health`（DB 接続チェック込み）を追加。`curl localhost:8000/api/health` → `{"status":"ok","app":"EC-PORTFOLIO","database":"ok",...}`
- serversideup の `8.4-fpm-nginx` に `intl` / `gd` / `bcmath` は非同梱と判明。R2 スコープでは未使用なので追加せず、docs 04 / 07 の記述を修正

**Step 4 — 2026-09-04 frontend（Next.js 15）**
- `create-next-app@15`（使い捨て `node:22-alpine` コンテナ、`--skip-install`）→ `frontend/`（Next 15.5.25 / React 19.1、App Router、TS、Tailwind v4、no src dir、turbopack）
- 確定ライブラリを追加（`--package-lock-only` で lock 生成）: `zustand` / `@tanstack/react-query` / `react-hook-form` + `@hookform/resolvers` + `zod` / `@aws-sdk/client-s3` / `lucide-react`
- `package.json` に `engines: node >=22 <23`、`frontend/.nvmrc`（22）
- `next.config.ts`: `output: 'standalone'`（本番 Docker 用。dev には影響なし）
- `frontend/Dockerfile.dev`（node:22-alpine、起動時に `npm install && npm run dev`）
- `docker-compose.yml` に `frontend` サービス追加: `./frontend` マウント、`node_modules` は名前付きボリューム隔離、polling 有効（`WATCHPACK_POLLING` / `CHOKIDAR_USEPOLLING`）、`API_URL=http://backend:8080`
- 確認済み: `docker compose up -d` で 4 コンテナ起動、`curl localhost:3000` → 200、`tsc --noEmit` / `npm run lint` パス
- 初回 `npm install`（コンテナ内）は数分かかる。以降は名前付きボリュームにキャッシュされる

**Step 5 — 2026-09-04 BFF 疎通確認**
- `frontend/lib/api.ts`: サーバー側専用の `apiFetch<T>(path, init)`（`API_URL` を読む、非 ok は throw、`no-store`）。最小実装。キャッシュ制御・`ApiError`・トークン付与は後の Step で追加
- `frontend/app/bff/health/route.ts`: Route Handler。ブラウザ → Next → Laravel `/api/health` → Postgres の経路確認。上流エラーは 502。ブラウザが触る route.ts は全部 `app/bff/` 配下に置くルール
- 確認済み: `curl localhost:3000/bff/health` → `{"status":"ok","frontend":"ok","backend":{"status":"ok","database":"ok"}}`。`tsc --noEmit` / `lint` パス

### 環境構築フェーズ 完了（Step 1〜5）
ローカルで「ブラウザ → Next.js → Laravel → PostgreSQL」＋ MinIO が `docker compose up -d` だけで動く状態。次から機能実装（DB マイグレーション設計 → 商品閲覧…）。

---

## 機能実装フェーズ

**Step 6 — 2026-09-04 DB マイグレーション: categories + product 系**
- `categories`（`name` / `slug` unique / `position`）。初期4件は Seeder ではなく `/admin` から作る方針をコメントに明記
- `products`（`category_id` FK RESTRICT、`slug` unique、`size_chart` jsonb nullable、`is_published` default true、`(is_published, position)` index、`price > 0` CHECK）
- `product_images`（`product_id` FK CASCADE、`path`、`(product_id, position)` index）
- `product_variants`（`product_id` FK CASCADE、`sku` unique、`stock >= 0` CHECK）
  - `UNIQUE(product_id, size, color)` に加え、`color IS NULL` 用の部分 UNIQUE インデックスを別途作成（Postgres は NULL 同士を等価に扱わないため、単一色商品の重複を通常の UNIQUE では防げない）
- マイグレーションのファイル名順で実行されるため、`product_images` が `products` より前に来ないよう timestamp を調整（`_i` < `_s` の罠）
- 確認済み: `migrate:fresh` でクリーンに全テーブル作成、`\d` でスキーマ・FK・CHECK・index を確認

**Step 7 — 2026-09-04 DB マイグレーション: users.role + addresses + orders 系**
- `add_role_to_users`（`role` varchar(20) default `customer`、`password` の後）
- `addresses`（`user_id` FK CASCADE、`is_default` default false。デフォルト1件の担保はアプリ側）
- `orders`（`user_id` FK RESTRICT、`order_number` unique、`ship_*` スナップショット列、金額は int。`status` に `CHECK IN ('pending','cancelled')`。R3 で `paid`/`shipped` を足すときは制約を貼り直す migration を追加）
- `order_items`（`order_id` FK CASCADE、`product_id` / `product_variant_id` は nullable FK SET NULL、表示用はスナップショット列、`quantity > 0` CHECK）
- ここでも `order_items` が `orders` より前にソートされる罠を timestamp 調整で回避
- 確認済み: `migrate:fresh` で全17テーブル作成、`\d` でスキーマ確認。DB スキーマ設計フェーズ完了（docs/02 の全テーブル）

**Step 8a — 2026-09-04 Enum + config/shop.php**
- `config/shop.php`: マジックナンバー集約（`low_stock_threshold` / `new_product_days` / `shipping_fee` / `free_shipping_threshold` / `cart_max_quantity_per_line`）
- `app/Enums/UserRole`（`customer` / `admin`）、`OrderStatus`（`pending` / `cancelled`）、`StockStatus`（`sold_out` / `low_stock` / `in_stock` ＋ `fromStock()`）
- `StockStatus` は `fromStock()` のみ。`label()` / `selectable()` の UI 文字列はフロント担当（API は value のみ返す。ec1 と同方針）
- `ProductSize` enum は作らない（`size` は文字列のまま。「予測で作らない」）。docs/06 の記述もそれに合わせて修正
- `make:enum Enums/Foo` がネストした `app/Enums/Enums/` を作る挙動だったので手書きに切替
- 確認済み: `config:show shop` OK、tinker で `StockStatus::fromStock(0/3/4)` → `sold_out` / `low_stock` / `in_stock`

**Step 8b — 2026-09-04 Eloquent モデル**
- `Category` / `Product` / `ProductImage` / `ProductVariant` / `Address` / `Order` / `OrderItem` を作成、`User` を拡張
- リレーション（`hasMany` / `belongsTo`）、`casts()`（`size_chart`→array、`is_published`→bool、`status`→`OrderStatus`、`role`→`UserRole`、金額→int）
- `Product::scopePublished`（Laravel 12 の `#[Scope]` アトリビュート）
- `User` / `Address` に `$attributes` で DB デフォルト（`role='customer'` / `is_default=false`）をミラー（create 直後の未再取得インスタンスで null にならないように）
- `AppServiceProvider::boot()` に `Model::preventLazyLoading(! isProduction())`（dev で N+1 を例外化。docs/06 §4。ec1 では未導入だった）
- 確認: tinker でリレーション・キャスト動作 OK。`preventLazyLoading` は**複数行のクエリ結果でのみ**発動する（Laravel 仕様: 単一モデルの遅延ロードは N+1 ではないので素通し）ことを確認

**Step 9a — 2026-09-04 Factory 一式**
- `Category` / `Product` / `ProductImage` / `ProductVariant` / `Address` / `Order` / `OrderItem` の Factory を作成、`User` に `admin()` state 追加
- state: `Product::unpublished()`、`ProductVariant::soldOut()` / `lowStock()` / `inStock()`、`Address::default()`、`Order::cancelled()`
- `OrderItemFactory` は内部で product + variant を作ってスナップショット列に値をコピー（参照先と中身がズレないように）
- `OrderFactory` の送料は `config('shop.*')` を参照して subtotal と整合
- 都道府県は faker(en_US) で作れないので固定リストから選ぶ（Address / Order）
- `ProductVariantFactory` に注意コメント: 1商品に複数 variant を作るときは `->sequence()` で size を明示（`->count(3)` だけだと size 衝突で UniqueConstraintViolation）
- Seeder はまだ。ダミー顧客はユーザーが手動投入。商品シード（画像なし・NO IMAGE 表示）は別 Step で
- 確認: 全 Factory を組み合わせて生成 → role / is_default / キャスト / 在庫 state / 注文合計の整合を確認、Pint パス

**Step 9b — 2026-09-04 AdminUserSeeder**
- `AdminUserSeeder`: `updateOrCreate(['email'=>'test@example.com'], ['name'=>'test', 'password'=>'Takumi7355', 'role'=>Admin, 'email_verified_at'=>now()])`。`db:seed` を何度流しても重複しない
- `DatabaseSeeder` はスキャフォールドの factory ユーザー生成を削除し `AdminUserSeeder` のみ呼ぶ
- categories・商品・ダミー顧客の Seeder は作らない（categories は /admin から、顧客は手動、商品は別 Step）
- 確認: `migrate:fresh --seed` で admin 1人（role=admin / verified）、`Hash::check('Takumi7355', ...)` OK、`db:seed` 再実行しても users は1件のまま

**Step 10 — 2026-09-04 CategorySeeder + ProductSeeder**
- `CategorySeeder`: Tops / Bottoms / Outerwear / Accessories（slug キーで `updateOrCreate`）
- `ProductSeeder`: 開発・レビュー用カタログ 14点（Tops 4 / Bottoms 4 / Outerwear 3 / Accessories 3）
  - 商品データは手書き（faker ではなくブランドの世界観に合わせた固定文）
  - `size_chart`: Tops/Outerwear は 着丈・身幅・肩幅・袖丈、Bottoms は ウエスト・股上・股下・わたり幅・裾幅、Accessories は null
  - variant: アパレル S/M/L、アクセサリー FREE 単一。sku = `{product_code}-{size}` で `updateOrCreate`（冪等）
  - 在庫は SOLD OUT（`Heavyweight Long Sleeve Tee` L / `Wide Denim Pants` M / `Wool Knit Beanie`）・LOW STOCK（`Relaxed Tapered Trousers` S / `Wool Blend Coat` 全 / `Leather Card Holder`）を混ぜて表示確認用に
  - `Ribbed Knit Polo` を `is_published=false`（published スコープ確認用）
- **画像（product_images）は作らない**。フロントは画像ゼロなら "NO IMAGE"（グレー背景）を表示する（別 Step）
- 方針変更: categories を Seeder で作る（docs/02 更新）
- `DatabaseSeeder` は `AdminUserSeeder` → `CategorySeeder` → `ProductSeeder` の順で呼ぶ
- 確認: `migrate:fresh --seed` で 4カテゴリ / 14商品（公開13）/ 36 variant、`db:seed` 再実行で件数不変（冪等）

**Step 11a — 2026-09-04 商品閲覧 API（カテゴリ一覧 + 商品一覧）**
- `GET /api/categories`: `CategoryController@index` + `CategoryResource`（id / name / slug / position、position 順）
- `GET /api/products`: `ProductController@index` + `ProductSummaryResource` + `ProductImageResource`
  - `published()` スコープで公開のみ、`?category=` slug 絞り込み、`?new=true` で新着30日以内・新着順、`?limit=`
  - `->with(['category', 'images' => 2件])` ＋ `->withSum('variants', 'stock')` で N+1 回避
  - `stock_status` は全 variant 合算（`variants_sum_stock`）を `StockStatus::fromStock()` に通す
  - 画像は `/media/{path}` を組み立てて返す（seeder は画像なしなので今は `images: []`）
- 確認（手動 / curl）: カテゴリ4件、tops 3件（未公開除外）、`?new` 新着順、未知カテゴリ→空、`stock_status` は beanie→sold_out / card-holder→low_stock / cap→in_stock
- **自動テストは後回し**（Step 11 で決定）。ec1 も Feature テスト未整備。`phpunit.xml` は sqlite だがマイグレーションが Postgres 専用機能を使うため、テスト着手時に `ec2_testing` DB へ切り替えが必要

**Step 11b — 2026-09-04 商品詳細 API（GET /api/products/{slug}）**
- `ProductController@show` + `ProductDetailResource` + `ProductVariantResource`
  - ルートは `{product:slug}`（slug バインド。モデル既定キーは id のまま）
  - `abort_unless($product->is_published, 404)` で未公開・存在しない slug は 404
  - `load(['category', 'images'→position順, 'variants'→position順])`
  - `variants`: `stock` 生値 + `stock_status`（variant 個別）
  - `colors`: color が入った variant の色一覧（重複排除）。今回のシードは全 null なので `[]`
  - `related`: 同カテゴリの他の公開商品 最大4点を `setRelation('related', ...)` で疑似リレーション化 → `ProductSummaryResource`
- 確認（手動）: `boxy-cotton-t-shirt` 詳細（variants S/M/L・related 2件）、`heavyweight-long-sleeve-tee` の L が `sold_out`、未公開 `ribbed-knit-polo`→404、存在しない slug→404

**Step 12a — 2026-09-04 認証 API（register / login / logout / me）**
- Action: `RegisterUser`（`User::create` → `createToken('api')`）、`AuthenticateUser`（メール存在とパスワード不一致を区別しない汎用エラー、`ValidationException` で 422）
- FormRequest: `RegisterRequest`（`name` / `email` unique / `password` min:8 confirmed）、`LoginRequest`
- `UserResource`（id / name / email / role→value）
- `AuthController`（register 201・login 200、どちらも `UserResource + additional(['token'=>...])`／logout は `currentAccessToken()->delete()` で今のトークンだけ失効 → 204）
- `ProfileController@show`（GET /me、`auth:sanctum`）
- `AppServiceProvider` に `RateLimiter::for('login')` = メール+IP で 5回/分。`/login` に `throttle:login`
- 確認（手動）: register→201(token/role=customer)、/me（token あり→user / なし→401）、重複メール→422、password 不一致→422、login OK（admin は role=admin）、wrong pw / unknown email はどちらも同じ 422 メッセージ、logout→204→その後 /me は 401、login 6連打で 6回目 429
- `PUT /me` / `PUT /me/password`（プロフィール更新）は Step 12b

**Step 12b — 2026-09-04 プロフィール更新 API（PUT /me, PUT /me/password）**
- Action: `UpdateProfile`（name / email 更新）、`UpdatePassword`（更新のみ。現パスワード照合は FormRequest 側）
- FormRequest: `UpdateProfileRequest`（`email` は `Rule::unique('users','email')->ignore($this->user()->id)` で自分を除外）、`UpdatePasswordRequest`（`current_password:sanctum` 組み込みルール ＋ `password` min:8 confirmed）
- `ProfileController` に `update`（→ `UserResource`）／`updatePassword`（→ 204）を追加
- routes に `PUT /me` `PUT /me/password`（`auth:sanctum` グループ）
- 確認（手動）: 氏名・メール変更 200、他人のメール→422、メール据え置き→200（自分除外）、パスワード変更 204 → 旧 pw ログイン不可・新 pw 可、`current_password` 誤り→422（`errors.current_password`）
- これで docs/03 の認証エンドポイントは全部そろった

**Step 13 — 2026-09-04 住所録 API（/api/addresses）**
- Action: `CreateAddress` / `UpdateAddress` / `DeleteAddress` / `SetDefaultAddress`（`is_default` 切り替えはトランザクション内で「他を false 化」→「自分を更新」）
- FormRequest: `StoreAddressRequest` / `UpdateAddressRequest`（`postal_code` は `regex:/^\d{3}-\d{4}$/`。`UpdateAddressRequest::authorize()` で `route('address')?->user_id === user()->id` を確認し他人のものは 404）
- `AddressResource`、`AddressController`（index は `is_default` 先頭 / store 201 / update / destroy 204 / setDefault）。destroy・setDefault はボディなしなので Controller の `authorizeOwnership()` で 404 判定
- routes（`auth:sanctum` グループ）: GET/POST `/addresses`、PUT/DELETE `/addresses/{address}`、POST `/addresses/{address}/default`
- 確認（PHP + curl スクリプト）: store（1件目 is_default=false、2件目 is_default=true で1件目が false 化）、index は default 先頭、setDefault で入れ替わり、他人が update/delete → 404、`postal_code` 形式不正 → 422、削除 204
- デフォルト住所を削除しても他への自動昇格はしない（docs/03 に明記なし）

**Step 14a — 2026-09-04 注文作成 API（POST /api/orders）**
- DTO: `CartLineInput` / `ShippingAddressInput`（addresses 用と orders.ship_* 用の両方に変換）/ `CreateOrderInput`（`fromRequest()`）
- Domain: `ShippingFeeCalculator`（`config('shop.*')` 参照）/ `OrderNumberGenerator`（`EC-YYYYMMDD-NNNN`、当日連番を `lockForUpdate` で採番）
- Exception: `InsufficientStockException`（422 + `unavailable: [{variant_id, available}]`）/ `UnpublishedProductException`（422）。どちらも `render()` を持つので自動でハンドリングされる
- `CreateOrder` Action（`DB::transaction` 内）: variant を `lockForUpdate` → 在庫検証 → 未公開検証 → subtotal サーバー再計算 → 送料 → `order_number` 採番 → orders / order_items 作成 → `decrement('stock')` → 新規住所を save_address なら addresses にも
- `StoreOrderRequest`: 形式的検証のみ（`items.*.variant_id` exists、`quantity` max=config、`address_id` は `Rule::exists->where('user_id', ...)` で本人のもの、`address_id` / `address` は `required_without` で片方必須）
- `OrderResource` / `OrderItemResource`、`OrderController@store`（201）
- 確認（PHP + curl）: 正常注文 201（`EC-20260904-0001`、subtotal 27000 / 送料0 / 在庫 8→6・12→11）、売り切れ→422（unavailable 返る・在庫据え置き）、未公開→422、新規住所+save_address で addresses が 1→2、他人の address_id→422、address なし→422
- `image_url` は画像なし商品では空文字（`order_items.image_url` は NOT NULL）
- `GET /api/orders`（一覧）・`GET /api/orders/{number}`（詳細）は Step 14b

**Step 14b — 2026-09-04 注文一覧・詳細 API**
- `OrderSummaryResource`（order_number / created_at / item_count / total / status）。`withCount('items')` の `items_count` を使い明細は全件ロードしない
- `OrderController@index`: 本人の注文を `created_at` 降順（`id` 降順を tiebreaker）、`withCount('items')`
- `OrderController@show`: `$request->user()->orders()->where('order_number', ...)->with('items')->firstOrFail()`。本人スコープ＋`firstOrFail` なので他人・存在しない番号はどちらも 404
- routes: `GET /orders`、`GET /orders/{orderNumber}`
- 確認（PHP + curl）: 一覧は本人のみ・新しい順・item_count、詳細は自分のは 200（items 込み）、他人の注文番号→404、存在しない番号→404、無認証→401
- これで docs/03 の注文エンドポイントは全部そろった（バックエンドの公開＋会員 API は管理を除き完成）

---

## フロントエンド実装フェーズ

**Step F0 — 2026-09-04 フロントエンド設計**
- `docs/08-frontend-design.md` を作成。ディレクトリ構成 / データ取得（Server Component 読み取り vs `/bff` Route Handler）/ 認証（Cookie `ec_token` + middleware）/ カート（zustand persist）/ 型は `lib/types.ts`・zod は `lib/schemas/` に集約 / スタイル（4色トークン・ダークモードなし）/ NO IMAGE 表示 / 実装 Step（F1〜F8）
- R1 の反省を反映: ec1 は規約を後付けして「移行中」のまま終わったので、R2 は最初からその形で書く
- ルートグループ `app/(shop)/`（Header/Footer 付き）、`app/bff/`（Route Handler）、`app/admin/`（後）に分ける

**Step F1 — 2026-09-04 共通レイアウト**
- `app/layout.tsx`: スキャフォールドを掃除（`Geist_Mono` / `dark:` / 旧 metadata 削除）。`<html><body>` シェル + Geist Sans + metadata テンプレート（`%s | EC-PORTFOLIO`）だけ
- `app/globals.css`: デザイントークン（`--color-ink/paper/mist/graphite` の4色）、`@theme inline` で `bg-ink` 等を有効化、ダークモードなし
- `app/(shop)/layout.tsx`: `<Header/>` + `<main class="min-h-screen pt-16">` + `<Footer/>`
- `components/layout/`: `Header`（fixed・白背景・下ボーダー、ロゴ + ACCOUNT + CART、中央ナビなし）/ `Footer`（Newsletter + 静的ラベル + コピーライト）/ `NewsletterForm`（client、送信でトーストのみ）/ `AccountLink`・`CartCount`（F1 は静的。F5/F4 で client 化）
- `lib/constants.ts`（`SESSION_COOKIE_NAME` / 送料しきい値 / `LOW_STOCK_THRESHOLD`）、`lib/types.ts`（backend Resource と 1:1 の型を全部）
- `app/page.tsx` → `app/(shop)/page.tsx`（F2 までのプレースホルダ）
- 確認: `curl localhost:3000` 200、Header/Footer 描画、`tsc --noEmit` / `lint` パス、スクショで見た目確認
- **IDE エラー対処**: frontend の `node_modules` は名前付きボリューム隔離でホスト側が空だったため、エディタの TS サーバー / ESLint が `.tsx` 全体をエラー表示していた。ホストにも `cd frontend && npm ci` して解消（コンテナ用 Linux バイナリとは別に macOS 用が入る）。docs/07 に手順を追記

**Step F2a — 2026-09-04 トップページ（カテゴリ別グリッド）**
- `lib/categories.ts`（`getCategories`）/ `lib/products.ts`（`getProducts` / `getProduct`）: Server Component 直 fetch。`.tsx` に fetch を書かない
  - キャッシュはいまは apiFetch 既定（no-store）。dev で reseed を即反映したいため。ISR + revalidateTag は管理画面フェーズで
- `components/product/ProductMedia`: 画像ゼロなら `bg-mist` + "NO IMAGE"（`aspect-[3/4]`）。画像ありなら `next/image`（ホバー差し替え対応、当面は dormant）
- `components/product/ProductCard`: NEW / LOW STOCK / SOLD OUT バッジ（`stock_status` は全 variant 合算）、カテゴリラベル、商品名（line-clamp-2）、`¥12,000`
- `components/home/CategoryGrid`: カテゴリを position 順に、各カテゴリの全公開商品を grid（`grid-cols-2 md:grid-cols-4`）。商品0件のカテゴリはセクションごと非表示
- `app/(shop)/page.tsx`: `<CategoryGrid />` のみ（Hero / Concept / Lookbook / About は F2b）
- `Header` をモバイルで詰める（`px-4 sm:px-6` / ロゴ tracking を縮小）
- 確認: `curl localhost:3000` 200、h2 は Tops/Bottoms/Outerwear/Accessories、公開13商品（Ribbed Knit Polo 除外）、`tsc`/`lint` パス、デスクトップのスクショで見た目確認
  - ※ headless Chrome のモバイル幅スクショが layout viewport とズレて信用できないので、モバイル表示は実ブラウザで F8 の仕上げ時に確認する

**Step F2b — 2026-09-04 トップページの装飾セクション**
- `components/home/`: `Hero`（`h-screen` の `bg-ink`、中央にブランド名 + タグライン）/ `BrandConcept`（理念 3〜4行、中央寄せ）/ `Lookbook`（`overflow-x-auto` の帯、`bg-mist` プレースホルダ6枚）/ `AboutSection`（沿革・素材・製造の3ブロック、画像枠は `bg-mist`、交互レイアウト）
- 文言はすべてプレースホルダ（英語のブランド世界観文）。実画像は `TODO(実画像)` コメント
- `app/(shop)/page.tsx`: `Hero → BrandConcept → Lookbook → CategoryGrid → AboutSection` の順（docs/01 通り）
- 全部データ取得なしの静的 Server Component
- 確認: `curl` 200、`<section>` 8個（Hero + Concept + Lookbook + カテゴリ4 + About）、About の3ラベル（Since 2019 / Material / Production）描画、`tsc`/`lint` パス、Hero のスクショ

**Step F3a — 2026-09-04 商品詳細ページ（骨格）**
- `lib/api.ts` に `ApiError`（`status` / `body`）を追加。`apiFetch` は非 2xx で `ApiError` を throw（body は JSON パース試行）
- `lib/products.ts` の `getProduct` を `Promise<ProductDetail | null>` に。404（`ApiError.status === 404`）なら null、それ以外は再 throw
- `app/(shop)/products/[slug]/page.tsx`: Server Component。`getProduct` が null なら `notFound()`。`generateMetadata` で `title` に商品名
  - パンくず `HOME / 商品名`、左: `ProductMedia`（画像ゼロなので NO IMAGE）、右パネル（PC スティッキー）: カテゴリ / 商品名 / 価格 / 配送目安の囲み / アコーディオン（`<details>`、JS 不要）/ `SIZE GUIDE` は `size_chart` を表描画 / `ORIGIN`・`PRODUCT CODE`
  - 下部 `YOU MAY ALSO LIKE`: `related` を `ProductCard` グリッド
  - サイズセレクタ + ADD TO CART（`VariantSelector`）は F3b。パネル内にコメントで枠を確保
- `app/(shop)/not-found.tsx`: `notFound()` 用（404 / Page Not Found / Continue Shopping）。Header/Footer は (shop) レイアウトが付く
- 確認: `boxy-cotton-t-shirt` 200（全アコーディオン・size_chart 表・related 2件）、未公開 `ribbed-knit-polo` → 404、存在しない slug → 404 で not-found 描画、`tsc`/`lint` パス、スクショ
- **仕様変更**: `related`（YOU MAY ALSO LIKE）の `limit(4)` を撤廃。カテゴリ1つあたり3〜6点なので上限不要、position 順に同カテゴリの他公開商品を全件。docs/01・03 も修正

**Step F3b — 2026-09-04 VariantSelector + カートストア**
- `lib/stores/cart.ts`: zustand + persist（localStorage キー `ec2-cart`、`skipHydration: true`）。`addItem`（同 variantId は数量加算）/ `removeItem` / `setQuantity`（0 以下で削除）/ `clear` / `useCartItemCount`（数量合計）
- `lib/types.ts` に `CartItem`（フロント内部型）を追加
- `components/providers/CartHydration.tsx`: マウント後に `useCartStore.persist.rehydrate()`。`app/layout.tsx`（root）に配置
- `components/layout/CartCount.tsx`: 静的 → client 化。`useCartItemCount()` で `CART (n)` を表示
- `components/product/VariantSelector.tsx`（client）: サイズセレクタ（`sold_out` は `disabled` + 打ち消し線、`low_stock` は `(LOW STOCK)` 表示）/ ADD TO CART（サイズ未選択 or 在庫0で `disabled`、押すと `addItem` + "Added" 2.5秒）。色スウォッチはコード済みだが R2 シードは全 `color=null` なので出ない
- 商品詳細ページの配送囲みとアコーディオンの間に `<VariantSelector>` を差し込み
- 確認（CDP 自動操作）: S 選択 → ADD TO CART 有効化 → クリックで CART (0)→(1)、`Added` 表示、localStorage に正しいスナップショット、同 variant 再追加で (1)→(2)（行は増えず数量加算）。`heavyweight-long-sleeve-tee` は L が打ち消し線・S に (LOW STOCK)。`tsc`/`lint` パス

**Step F4a — 2026-09-04 カートページ（骨格）+ QueryProvider**
- `components/providers/QueryProvider.tsx`: `QueryClientProvider`（`useState` で `QueryClient` を1回だけ生成）。`app/layout.tsx`（root）で `<CartHydration>` ごと包む。クライアント主体の読み書き（カート再検証 F4b / AccountLink F5 / account CRUD F6）で使う
- `app/(shop)/cart/page.tsx`（client）:
  - 空カート: `YOUR CART IS EMPTY` + `CONTINUE SHOPPING`
  - 明細行: NO IMAGE サムネ / 商品名（詳細リンク）・サイズ（・色）・単価 / 数量ステッパー（`−` は 1 で無効）/ Remove / 行合計
  - サマリー: `SUBTOTAL` / `SHIPPING`（`FREE_SHIPPING_THRESHOLD` 以上で Free）/ `TOTAL` / `CHECKOUT`
  - 金額は「追加時のスナップショット」。在庫再検証（売り切れ警告・在庫上限・価格変動・CHECKOUT ガード）は F4b
- 確認（CDP）: 空カート 200、M×2 + FREE×1 追加 → 2行・CART (3)・Subtotal ¥52,000・Shipping Free、ステッパー `+` で CART (3)→(4)、Remove で行削除 + ヘッダー同期。`tsc`/`lint` パス

**Step F4b — 2026-09-04 カートの在庫再検証**
- `app/bff/products/[slug]/route.ts`: client からカート明細を検証するための商品詳細エンドポイント（`getProduct` を呼ぶ、認証不要、null なら 404）
- `lib/hooks/useCartValidation.ts`（client、react-query の `useQueries`）: カート内 unique な slug ごとに `/bff/products/{slug}` を1本ずつ。`getValidation(item)` が `{ currentStock, currentPrice, available }` を返す（未取得は楽観的に available、商品消滅は available=false、variant 消滅も false）
- `lib/types.ts` に `CartLineValidation`
- カートページに組み込み:
  - 売り切れ/未公開 → `Sold Out` 表示、行の `+` 無効
  - 在庫が今の数量を下回る → `Only N left in stock...` 警告、`+` 無効
  - 価格変動 → 最新価格で行合計・小計を再計算
  - どれか該当 or 再検証中 → `CHECKOUT` を無効化（`pointer-events-none` + graphite 背景 + `tabIndex=-1`）
- `aspect-[3/4]` / `aspect-[4/3]` → 正準形 `aspect-3/4` / `aspect-4/3` に統一（Tailwind IDE 警告解消）
- 確認（CDP）: M×1（正常）+ Beanie×1（売り切れ）+ S×5（在庫2）→ Beanie に `Sold Out`、S に `Only 2 left`、S 行価格が ¥99,999→¥22,000 に補正、Subtotal は補正後で ¥139,000、Checkout 無効、S 行 `+` 無効・M 行 `+` は有効。`tsc`/`lint` パス
- 補足: `/bff/products/{slug}` は related まで読む重めのクエリなので、dev 環境では再検証の反映に1〜2秒の間がある（本番 opcache 有効なら短い）

**Step F5a — 2026-09-04 認証の BFF（lib/auth + Route Handler + middleware）**
- `lib/api.ts` に `apiErrorResponse(error)`: `ApiError` を Laravel と同じ形・同じステータスでブラウザに返す（フォームの 422 表示用）。`ApiError` 以外は投げ直す
- `lib/auth.ts`（サーバー専用）: `getSessionToken` / `setSessionCookie`（httpOnly / secure(prod) / sameSite=lax / 30日）/ `clearSessionCookie` ＋ `registerUser` / `loginUser` / `logoutUser` / `fetchCurrentUser`
- `lib/types.ts` に `LoginPayload` / `RegisterPayload`
- Route Handler（薄い窓口。実処理は lib/auth）:
  - `app/bff/register/route.ts`（POST → 201、token は Cookie にだけ、body は user）
  - `app/bff/login/route.ts`（POST → 200、同上）
  - `app/bff/logout/route.ts`（POST → Laravel でトークン失効 → Cookie 削除 → 204。失効失敗は握りつぶす）
  - `app/bff/me/route.ts`（GET → Cookie 無ければ即 401、あれば `/api/me`。PUT は F6）
- `middleware.ts`: `/checkout/:path*` `/account/:path*` を Cookie 有無でガード、未ログインは `/login?redirect=<元パス>`（307）。`/admin` は role 確認が要るので含めない
- 確認（curl）: register 201 + `Set-Cookie ec_token`（HttpOnly / Max-Age=2592000）+ body に token 無し、`/bff/me`（cookie あり→user / なし→401）、重複メール→422 中継、login 200（role=admin）、login 失敗→422、logout 204 + Cookie 削除 → 以後 `/bff/me` 401、`/account`・`/checkout` 未ログイン→`/login?redirect=` へ 307、cookie あれば通過。`tsc`/`lint` パス

**Step F5b-1 — 2026-09-04 認証フォーム（schemas + LoginForm / RegisterForm）**
- `lib/schemas/login.ts` / `register.ts`（zod）: backend の `Auth/*Request` とルールを揃える。`registerSchema` は `.refine()` で `password_confirmation` 一致（Laravel の `confirmed` と二重防御）。スキーマファイルが `z.infer` 型（`LoginFormValues` / `RegisterFormValues`）も export（ec1 の `address.ts` の先例に合わせる）
- `components/ui/Field.tsx`: ラベル + 下線入力 + エラー文の共通1フィールド。`forwardRef` で `register("x")` をそのまま spread できる形。login / register / F6 の profile / password / address で共用
- `components/auth/LoginForm.tsx` / `RegisterForm.tsx`（client、react-hook-form + `zodResolver`）:
  - 送信 → `fetch('/bff/login' | '/bff/register')` → 成功で `queryClient.invalidateQueries(['session'])`（AccountLink のキャッシュ破棄）→ `?redirect=` 先 or `/account` へ `router.push` + `refresh`
  - 失敗（422）: login は汎用 `message`、register は `errors` の先頭フィールドメッセージ → 画面下に表示
- 画面（`login/page.tsx` 等）と `AccountLink` の差し替えは F5b-2。F5b-1 単体では動作確認できない（`tsc`/`lint` パスのみ）

**Step F5b-2 — 2026-09-04 ログイン/登録の画面 + AccountLink**
- `app/(shop)/login/page.tsx` / `register/page.tsx`: `<Suspense>` で `LoginForm` / `RegisterForm` を包むだけ（`useSearchParams` を使うため）。metadata で `title`
- `components/layout/AccountLink.tsx`: 静的 → client 化。`useQuery(['session'])` で `/bff/me` を見て、ログイン中は `/account`・未ログインは `/login` にリンク。`staleTime: 60s`
- **`invalidateQueries` の `await` がハングする問題**に当たり、`queryClient.setQueryData(['session'], body)` に変更（フォームは既に user を持っているので refetch 不要。遷移直後に ACCOUNT リンクが正しくなる）
- 確認（CDP）: `/login?redirect=/cart` でログイン → `/cart` に遷移、ヘッダー ACCOUNT が `/account` に、`/bff/logout` 後は `/login` に戻る、ログイン失敗は `/login` のまま + エラー文表示、register も同様に遷移。`tsc`/`lint` パス
- 既知: `/account`・`/checkout` はまだルートが無い（F6/F7）ので redirect 先が Next の素の 404 になる。ルート作成後に `(shop)/not-found` 経由の表示になる。ルート `app/not-found.tsx` は F8 で追加

**Step F6-1 — 2026-09-04 アカウント ダッシュボード + ログアウト**
- `lib/auth.ts` に `requireAuth(redirectTo)`: 要ログイン Server Component の先頭で呼ぶ。Cookie が無い/失効なら `/login?redirect=<戻り先>` へ `redirect()`、有効なら `{ user, token }` を返す（middleware は Cookie 有無しか見ないので、有効性チェックはここ）
- `lib/orders.ts`: `fetchOrders` / `fetchOrderDetail`（Server Component 直呼び。トークンだけ引数で渡す）。`createOrder` は F7
- `app/(shop)/account/page.tsx`: `requireAuth("/account")` → `fetchOrders` → ダッシュボード（`Welcome, {name}` / Recent Order 1件 or "No orders yet" / メニュー Orders・Addresses・Profile・Logout）
- `components/account/LogoutButton.tsx`（client）: `/bff/logout` → `setQueryData(['session'], null)` → `router.replace('/')` + `refresh`
- 確認（CDP、ルート pre-warm 後）: 未ログイン `/account` → `/login?redirect=%2Faccount`、register → `/account` に "Welcome, Account Taro" / "No orders yet" / メニュー3件 + Logout、Logout → ACCOUNT リンクが `/login` に戻る、以後 `/account` 再訪で `/login` へ。`tsc`/`lint` パス
- テスト tips: dev サーバーは初回ルートコンパイルが重く、CDP テストで待ち時間不足の false fail が出る。テスト前に `curl` でルートを pre-warm し、submit 後は 6〜7秒待つ。フォームログインが不安定なテストは `Network.setCookie` で `ec_token` を直接セットして回避

**Step F6-2 — 2026-09-04 注文履歴・注文詳細**
- `lib/orders.ts` の `fetchOrderDetail`（throw）を `findOrder`（404 → null）に。ページ側で `notFound()`
- `app/(shop)/account/orders/page.tsx`: `requireAuth` → `fetchOrders` → 一覧（番号 / 日付 / 点数 / 合計 / ステータス、行クリックで詳細へ）。0件は "No orders yet."
- `app/(shop)/account/orders/[number]/page.tsx`: `requireAuth` → `findOrder` → 詳細（パンくず / 番号 + ステータス / 日時 / 明細 / 金額（Subtotal・Shipping・Total）/ 配送先スナップショット）。`generateMetadata` で `title` に注文番号。他人・存在しない番号は 404
  - `order_items.image_url` が空文字の場合（＝画像ゼロ商品の実注文）は "No Image"、非空なら `next/image`
- 確認（CDP、`Network.setCookie` でログイン）: 一覧2件・日付・点数・ステータス、詳細（明細・金額・配送先）、他人の注文番号 → 404、存在しない番号 → 404。`tsc`/`lint` パス
- 既知: `OrderItemFactory` はダミーの `image_url` パスを生成するので、Factory 由来の注文詳細では画像が 404 で崩れる。実注文（F7 チェックアウト経由、seed 商品は画像なし）では空文字 → "No Image" になるので実害なし。気になれば F8 で Factory を調整

**Step F6-3 — 2026-09-04 住所録（/account/addresses）**
- `lib/addresses.ts`（サーバー専用）: `fetchAddresses` / `createAddress` / `updateAddress` / `deleteAddress` / `setDefaultAddress`
- `lib/schemas/address.ts`（zod、`postal_code` は `123-4567` 形式）。`lib/types.ts` に `AddressPayload`
- BFF: `app/bff/addresses/route.ts`（GET / POST）、`[id]/route.ts`（PUT / DELETE）、`[id]/default/route.ts`（POST）。各ルート先頭で `getSessionToken` → 無ければ 401
- `components/account/AddressForm.tsx`: `Field` 共通コンポーネントで組む。編集時は `defaultValues`。`is_default` は扱わない
- `components/account/AddressBook.tsx`（client）: 一覧 + 追加 + 編集 + 削除 + Set As Default。**react-query は使わず** ローカル state + 「操作成功後に `/bff/addresses` を丸ごと再取得」（一覧が他画面と共有されない・`is_default` 排他の副作用を確実に反映するため）。`router.refresh()` で /checkout の住所選択にも波及
- `app/(shop)/account/addresses/page.tsx`: `requireAuth` → `fetchAddresses` → `<AddressBook>`
- 確認（curl 全経路 + CDP）: GET 1件、POST 201（郵便番号不正は 422 中継）、追加後 2件、Set As Default で `is_default` が入れ替わり一覧先頭に、PUT 200、DELETE 204 で 1件に、無認証 401。`tsc`/`lint` パス
- docs/08 §3.2 の「/account の CRUD は react-query」は緩め、共有・複雑な状態が要る場合に限定（AddressBook は単純なので不使用）

**Step F6-4 — 2026-09-04 プロフィール（/account/profile）。F6 完了**
- `lib/schemas/profile.ts` / `password.ts`（zod）。`lib/types.ts` に `UpdateProfilePayload` / `UpdatePasswordPayload`
- `lib/auth.ts` に `updateProfile` / `updatePassword`
- BFF: `app/bff/me/route.ts` に `PUT` を追加、`app/bff/me/password/route.ts`（PUT → 204）
- `components/account/ProfileForm.tsx`（`Field` 使用。成功時 `setQueryData(['session'], body)` でヘッダーにも反映）/ `PasswordForm.tsx`（`Field` 使用、成功時 `reset()`）
- `app/(shop)/account/profile/page.tsx`: `requireAuth` → `ProfileForm` + `PasswordForm`
- 確認（curl + CDP）: PUT /bff/me 200（他人のメール → 422 中継）、PUT /bff/me/password 204（新 pw でログイン可、current 誤り → 422 `errors.current_password`）、フォーム初期値・"Profile updated"・エラー表示。`tsc`/`lint` パス
- 既知: `current_password` 誤りのメッセージが Laravel 標準の英語（"The password is incorrect."）。他は日本語。`UpdatePasswordRequest::messages()` で揃えるのは F8

### F6（マイページ）完了
ダッシュボード / 注文履歴・詳細 / 住所録 CRUD / プロフィール・パスワード変更。すべて `requireAuth` で保護。

### R2 振り返り（実装後に記入）
- 良かった点:
- 詰まった点:
- R3 で変えること:

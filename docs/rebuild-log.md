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

### R2 振り返り（実装後に記入）
- 良かった点:
- 詰まった点:
- R3 で変えること:

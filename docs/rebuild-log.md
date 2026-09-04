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
- categories の初期4件は Seeder ではなく管理画面（`/admin`）から作成する。商品・管理者ユーザーなど他のシードは Seeder で作成

### R2 での新しい決定（R1 から変更）

- **ローカル開発環境を全面 Docker 化**（2026-09-03 決定）。R1 は「ミドルウェアだけ compose、frontend/backend はホストで `php artisan serve` / `npm run dev`」だったが、R2 は `docker compose up -d` だけで frontend / backend / db / minio が全部立ち上がる形にする。ホストに PHP / Node / Composer を入れない。
  - **理由**: `php artisan serve` を毎回手で打つのが面倒。環境差をなくす。Docker Compose 構成そのものをポートフォリオの見せ場にする。
  - frontend もコンテナ内で `next dev`（ソースをバインドマウント、`node_modules` は名前付きボリューム、Mac 対策で polling 有効化）。
  - artisan / composer / npm / pint / test は `docker compose exec` 経由。Laravel Boost の MCP 起動も `docker compose exec -T php php artisan boost:mcp` に変更。
  - 詳細は `docs/07-local-dev.md`。

- **backend のアプリサーバーを FrankenPHP / Octane から nginx + php-fpm に変更**（2026-09-03 決定）。ローカルも本番も同一イメージ `serversideup/php:8.4-fpm-nginx` を使う。
  - **理由**: Octane はワーカー常駐で状態リークの考慮が要るが、この規模では性能メリットより落とし穴のほうが大きい。nginx + php-fpm の定番構成に寄せる。
  - **自前 Dockerfile（fpm + nginx + supervisord 手書き）ではなく `serversideup/php` を採用**（2026-09-03 決定）。理由: nginx.conf / php-fpm.conf / supervisord.conf を保守しなくて済む、opcache・php-fpm チューニング・非root・healthcheck・s6 での PID1 シグナル処理が最初から入っている、`pdo_pgsql` `intl` など拡張も同梱、`AUTORUN_*` env で起動時 migrate / config:cache を宣言的に指定できる。デメリット（nginx 設定を手で書く経験は積めない）より、枯れたベースイメージを正しく使う方が実務的と判断。
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
- `git init`（ブランチ `main`）
- ルート設定: `.gitignore` / `.editorconfig`（2スペース、PHP のみ4）/ `.nvmrc`（Node 22）/ `README.md`
- コミットは docs と骨組みで分割（`docs: 設計ドキュメント一式（R2）` / `chore: リポジトリ骨組み`）
- 方針: 1コミット＝小さい単位で刻む（学習目的）

### R2 振り返り（実装後に記入）
- 良かった点:
- 詰まった点:
- R3 で変えること:

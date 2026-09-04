# デプロイ構成（Railway + Docker）

## サービス構成

| サービス | 中身 | 公開 | ポート |
|---|---|---|---|
| `frontend` | Next.js（standalone 出力）を Dockerfile でビルド | ✅ 公開ドメイン | 3000 |
| `backend` | Laravel。`serversideup/php:8.4-fpm-nginx`（nginx + php-fpm 同梱）を薄い Dockerfile でラップ | 内部のみ | 8080 |
| `postgres` | Railway の PostgreSQL | 内部のみ | 5432 |
| `bucket` | Railway Storage Bucket（S3互換、private）。商品画像 | 内部（S3 API） | - |

ブラウザ → `frontend`（公開） → `backend.railway.internal:8080`（内部） → `postgres.railway.internal`。
`backend` に公開ドメインは付けない（BFF のため不要、攻撃面を減らす）。

`serversideup/php` は nginx + php-fpm を s6-overlay で1コンテナにまとめた本番向けイメージ。opcache / php-fpm チューニング済み・非root・healthcheck 付き。`8.4-fpm-nginx`（Debian trixie）に同梱の拡張は `pdo_pgsql` `pdo_mysql` `pdo_sqlite` `redis` `opcache` `zip` `mbstring` `curl` `sodium` などの基本セット。**`intl` / `gd` / `bcmath` は入っていない**（このプロジェクトの R2 スコープでは未使用なので追加しない。必要になったら薄い Dockerfile で `docker-php-ext-install` する）。

## リポジトリ構成

```
ec2/
├── docker-compose.yml        # ローカル開発（全サービス。docs/07-local-dev.md）
├── frontend/
│   ├── Dockerfile            # 本番用（multi-stage, standalone）
│   ├── Dockerfile.dev        # ローカル用（next dev, バインドマウント）
│   └── ...
├── backend/
│   ├── Dockerfile            # 本番用（FROM serversideup/php:8.4-fpm-nginx の薄いラッパ）
│   └── ...                   # ローカルは serversideup イメージを直接使う（backend 用 Dockerfile.dev は不要）
└── docs/
```

Railway では各サービスの **Root Directory** を `frontend` / `backend` に設定し、それぞれの本番 `Dockerfile` を使う。

**アプリサーバーはローカルも本番も同一イメージ（`serversideup/php:8.4-fpm-nginx`）**（R2 の決定）。FrankenPHP / Octane は使わない。差は設定だけ:

| | ローカル | 本番（Railway） |
|---|---|---|
| backend | serversideup イメージを直接使い `./backend` をマウント | 同イメージにコードを焼き込み（薄い Dockerfile） |
| opcache | `PHP_OPCACHE_ENABLE=0` | `1` |
| 起動時 artisan | 手動（`docker compose exec`） | `AUTORUN_*` env で migrate / config:cache 等を自動実行 |
| frontend | `next dev`（コンテナ、ホットリロード） | `next start`（standalone ビルド） |

リクエスト処理のモデル（php-fpm がリクエストごとにワーカーを使い、状態を持ち越さない）はローカルも本番も同じ。

## 環境変数

### frontend
| 変数 | 値（本番） | 用途 |
|---|---|---|
| `API_URL` | `http://backend.railway.internal:8080` | サーバー側から Laravel を呼ぶ |
| `NEXT_PUBLIC_SITE_URL` | 公開ドメイン | 絶対URL生成 |
| `NODE_ENV` | `production` | |

### backend
| 変数 | 値 | 用途 |
|---|---|---|
| `APP_KEY` | `base64:...` | `php artisan key:generate --show` で生成し設定 |
| `APP_ENV` | `production` | |
| `APP_DEBUG` | `false` | |
| `APP_URL` | `http://backend.railway.internal:8080` | |
| `DB_CONNECTION` | `pgsql` | |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Railway 参照変数 |
| `SANCTUM_STATEFUL_DOMAINS` | （未設定でよい。トークン認証のみ） | |
| `FRONTEND_URL` | frontend 公開ドメイン | CORS 許可元 |
| `LOG_CHANNEL` | `stderr` | Railway ログに出す |
| `SESSION_DRIVER` | `database` or `array` | |
| `CACHE_STORE` | `database` | Redis を足さない前提 |
| `SSL_MODE` | `off` | serversideup。TLS は Railway エッジで終端、内部は http |
| `PHP_OPCACHE_ENABLE` | `1` | serversideup。本番は opcache 有効 |
| `AUTORUN_ENABLED` | `true` | serversideup。起動時に artisan 自動実行を有効化 |
| `AUTORUN_LARAVEL_MIGRATION` | `true` | 起動時に `migrate --force`（`ISOLATION` も true で多重起動対策） |
| `AUTORUN_LARAVEL_CONFIG_CACHE` | `true` | 起動時に `config:cache` |
| `AUTORUN_LARAVEL_ROUTE_CACHE` | `true` | 起動時に `route:cache` |
| `AUTORUN_LARAVEL_EVENT_CACHE` | `true` | 起動時に `event:cache` |
| `AUTORUN_LARAVEL_STORAGE_LINK` | `false` | S3 配信なので不要 |
| `FILESYSTEM_DISK` | `s3` | 商品画像を Railway バケットへ |
| `AWS_ACCESS_KEY_ID` | `${{Bucket.ACCESS_KEY_ID}}` | 参照変数 |
| `AWS_SECRET_ACCESS_KEY` | `${{Bucket.SECRET_ACCESS_KEY}}` | 参照変数 |
| `AWS_DEFAULT_REGION` | `${{Bucket.REGION}}` | 例 `auto` |
| `AWS_BUCKET` | `${{Bucket.BUCKET}}` | S3 API 用バケット名 |
| `AWS_ENDPOINT` | `${{Bucket.ENDPOINT}}` | 例 `https://storage.railway.app` |
| `AWS_USE_PATH_STYLE_ENDPOINT` | バケットの Credentials タブの指示に従う | |

### frontend（メディアプロキシ用に追加）
| 変数 | 値 | 用途 |
|---|---|---|
| `BUCKET_ACCESS_KEY_ID` | `${{Bucket.ACCESS_KEY_ID}}` | `/media/*` プロキシがバケットから GetObject |
| `BUCKET_SECRET_ACCESS_KEY` | `${{Bucket.SECRET_ACCESS_KEY}}` | |
| `BUCKET_REGION` / `BUCKET_NAME` / `BUCKET_ENDPOINT` | `${{Bucket.*}}` | |

## デプロイ時のマイグレーション

serversideup の Laravel Automations に任せる。上記 backend env の `AUTORUN_*` を設定すると、コンテナ起動時（nginx/php-fpm を上げる前）に自動で:

```
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan event:cache
```

- `AUTORUN_LARAVEL_MIGRATION_ISOLATION=true` を併せて設定すると、複数インスタンス同時起動時に migrate が1つだけ走る。
- **`db:seed` は AUTORUN に無い**（毎起動で流すと重複するため意図的）。初期データ投入は手動: `railway run php artisan db:seed --force`、または冪等シーダーを1回だけ。方針は R2 実装時に確定。

## backend/Dockerfile 方針（serversideup/php の薄いラッパ）

```dockerfile
FROM serversideup/php:8.4-fpm-nginx

# アプリを配置（イメージのデフォルトユーザーは www-data）
USER www-data
COPY --chown=www-data:www-data . /var/www/html

# 本番依存のみ・オートローダ最適化
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# nginx(8080) と php-fpm は s6-overlay がベースイメージで起動する。CMD は上書きしない
```

- nginx.conf も php-fpm.conf もプロセス管理（s6-overlay）も**書かない**（ベースイメージが持っている）。webroot は `/var/www/html/public`（デフォルト）。
- `pdo_pgsql` は同梱。`intl` / `gd` / `bcmath` は非同梱だが R2 では未使用。追加が必要になったら `RUN docker-php-ext-install ...` を1行足す。
- リッスンポートは 8080（非root）。Railway の backend サービスの内部ポートを 8080 に設定する。
- 権限（`storage/` `bootstrap/cache/`）はベースイメージの起動処理が調整する。

## frontend/Dockerfile 方針（Next.js standalone）

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build          # next.config: output: 'standalone'
FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

## ローカル開発

**すべて Docker。`docker compose up -d` だけで frontend / backend / db / minio が起動する**（`php artisan serve` も `npm run dev` もホストで打たない）。ホストに PHP / Node / Composer は不要。

構成・Dockerfile・初回セットアップ・よく使うコマンドは `docs/07-local-dev.md` に分離した。

## 画像

商品画像は Railway バケット（private・S3互換）に保存し、管理画面からアップロードする。詳細は `docs/05-admin.md`。

- 保存: Laravel が Flysystem S3 で `products/{product_id}/{ulid}.{ext}` として PUT
- 配信: Next.js の `/media/[...key]` が GetObject して `Cache-Control: immutable` で返す（Railway バケットは public 非対応のためプロキシ必須）
- ローカル: docker-compose の MinIO、または `FILESYSTEM_DISK=local` に切替

初期データ用の画像はユーザー提供。シーダーは `backend/database/seeders/assets/` に置いた画像をバケットへ PUT してから `product_images` 行を作る。

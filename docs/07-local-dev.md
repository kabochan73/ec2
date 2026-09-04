# ローカル開発環境（すべて Docker）

## 方針

- **`docker compose up -d` だけで開発環境が全部立ち上がる。** frontend / backend / db / minio をすべてコンテナで動かす。
- ホストに PHP / Composer / artisan を入れない。`php artisan serve` も `npm run dev` もホストでは打たない。
- **例外**: frontend の `node_modules` だけはホストにも入れる（`cd frontend && npm ci`）。エディタの TS サーバー / ESLint がホストで動くため。ホストの Node は必要（`.nvmrc` の 22）。詳細は「初回セットアップ」の項。
- artisan / composer / npm / pint / test はすべて `docker compose exec` 経由で叩く。
- ソースはバインドマウントするので、コード編集は即コンテナに反映される（ホットリロード）。
- **backend はローカルも本番も同じイメージ `serversideup/php:8.4-fpm-nginx`**（nginx + php-fpm 同梱）。ローカルはそのイメージを直接使い、本番は薄い Dockerfile でコードを焼き込むだけ（`docs/04`）。

## サービス一覧

| サービス | イメージ / ビルド | 役割 | ホスト公開ポート |
|---|---|---|---|
| `frontend` | `frontend/Dockerfile.dev`（node:22-alpine） | `next dev`（ホットリロード） | `3000` |
| `backend` | `serversideup/php:8.4-fpm-nginx`（そのまま使用） | Laravel。nginx + php-fpm 同梱。artisan の実行先 | `8000`（→ コンテナ 8080） |
| `db` | `postgres:16-alpine` | PostgreSQL 16 | `5432` |
| `minio` | `minio/minio` | S3 互換オブジェクトストレージ | `9000` / `9001` |
| `createbuckets` | `minio/mc` | 起動時に一度だけ `ec2-media` バケットを作る使い捨て | なし |

backend は nginx も php-fpm もイメージに入っているので、ローカルでもコンテナは1つ。

### 通信経路

```
ブラウザ
  → localhost:3000  ── frontend コンテナ（next dev）
        │ サーバー側 fetch（BFF）
        ▼
     http://backend:8080 ── backend コンテナ（nginx → php-fpm → Laravel）
        ▼
     db:5432 / minio:9000
```

- ブラウザが直接触るのは `localhost:3000`（frontend）だけ。BFF なので Laravel は基本ブラウザから叩かない。
- `localhost:8000` は curl / Postman / Laravel Boost MCP からの直接確認用に開けておく（コンテナの 8080 にマップ）。
- frontend コンテナからは `API_URL=http://backend:8080`（compose ネットワーク内の名前解決）で Laravel を呼ぶ。

## Dockerfile 方針

### backend — Dockerfile なし（ローカル）

`serversideup/php:8.4-fpm-nginx` を compose の `image:` で直接指定するだけ。nginx.conf も php-fpm.conf も書かない（イメージが持っている）。webroot は `/var/www/html/public`。

```yaml
# docker-compose.yml（抜粋）
backend:
  image: serversideup/php:8.4-fpm-nginx
  volumes:
    - ./backend:/var/www/html
  environment:
    SSL_MODE: "off"                 # 内部は http
    PHP_OPCACHE_ENABLE: "0"         # dev はキャッシュしない
    AUTORUN_ENABLED: "false"        # dev は artisan を手動で叩く
    PHP_FPM_POOL_NAME: "ec2"
  env_file: ./backend/.env
  ports: ["8000:8080"]
  depends_on:
    db: { condition: service_healthy }
    minio: { condition: service_healthy }
```

- 拡張は `pdo_pgsql` `redis` `opcache` `zip` `mbstring` などの基本セットが同梱。**`intl` / `gd` / `bcmath` は入っていない**（R2 スコープでは未使用なので今は不要）。追加したくなったら `FROM serversideup/php:8.4-fpm-nginx` の `Dockerfile.dev` を作って `docker-php-ext-install` を足す。
- `composer install` はイメージ起動時には走らない。初回だけ手動（下記セットアップ）。
- Linux ホストで所有権がずれる場合は `PUID` / `PGID` を自分の uid に合わせる（Mac の Docker Desktop なら不要）。

### frontend/Dockerfile.dev（next dev）

```dockerfile
FROM node:22-alpine
WORKDIR /app
# 依存はコンテナ内に置く。node_modules は名前付きボリューム
CMD ["sh", "-c", "npm install && npm run dev"]
```

- Mac（Docker Desktop）だとファイル変更検知が効かないことがあるので、環境変数で polling を有効化する:
  - `WATCHPACK_POLLING=true`（webpack/Next 内部）
  - `CHOKIDAR_USEPOLLING=true`（保険）
- Turbopack 使用時も上記でだいたい拾える。重い場合は `next dev`（webpack）に一時的に戻す。

## ボリューム設計（ホットリロードと依存の両立）

| 対象 | やり方 | 理由 |
|---|---|---|
| `./backend` → `/var/www/html` | バインドマウント | PHP のコード編集を即反映 |
| `/var/www/html/vendor` | バインドマウントのまま（＝ホストにも置く） | IDE 補完のため。I/O が重ければ名前付きボリュームに逃がす（その場合 vendor はコンテナ内だけ） |
| `./frontend` → `/app` | バインドマウント | Next のコード編集を即反映 |
| `/app/node_modules` | 名前付きボリューム | ネイティブモジュールの OS 差を避ける。ホストの node_modules で上書きさせない |
| `/app/.next` | 名前付きボリューム（任意） | ビルドキャッシュの I/O をコンテナ内に閉じて速くする |
| db / minio のデータ | 名前付きボリューム | `down` してもデータを残す |

## 環境変数（ローカル）

### backend/.env（要点）

| 変数 | 値 |
|---|---|
| `APP_URL` | `http://localhost:8000` |
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | `db`（コンテナ名。`127.0.0.1` ではない） |
| `DB_PORT` | `5432` |
| `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | `ec2` / `ec2` / `ec2secret` |
| `FILESYSTEM_DISK` | `s3` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | `ec2` / `ec2secret` |
| `AWS_DEFAULT_REGION` | `us-east-1`（MinIO は何でもよい） |
| `AWS_BUCKET` | `ec2-media` |
| `AWS_ENDPOINT` | `http://minio:9000` |
| `AWS_USE_PATH_STYLE_ENDPOINT` | `true`（MinIO 必須） |
| `CACHE_STORE` | `database` |
| `QUEUE_CONNECTION` | `sync` |

### frontend/.env.local（要点）

| 変数 | 値 |
|---|---|
| `API_URL` | `http://backend:8080`（サーバー側から Laravel を呼ぶ。コンテナ名） |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |
| `BUCKET_ENDPOINT` | `http://minio:9000` |
| `BUCKET_ACCESS_KEY_ID` / `BUCKET_SECRET_ACCESS_KEY` | `ec2` / `ec2secret` |
| `BUCKET_NAME` | `ec2-media` |
| `BUCKET_REGION` | `us-east-1` |

`/media` プロキシはサーバー側で動くので、コンテナ名 `minio` で解決できる。ブラウザが `next/image` 経由で叩くのは `localhost:3000/media/...` なので問題ない。

## 初回セットアップ

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

docker compose up -d --build          # 全サービス起動（初回は frontend をビルド）

# backend 初期化（初回のみ）
docker compose exec backend composer install
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan migrate --seed
```

- `db` の healthcheck が通ってから backend が起きるよう `depends_on: { db: { condition: service_healthy } }` を張る。
- `createbuckets` が `ec2-media` を作る（`minio` が healthy になってから）。

### IDE 補完のためにホストにも依存を入れる（frontend）

frontend の `node_modules` は名前付きボリュームに隔離しているので**ホスト側は空**。エディタの
TypeScript サーバー / ESLint はホストで動くため、そのままだと `.tsx` 全体で「`react` が見つからない」
等のエラーが出る。コンテナ用（Linux バイナリ）とは別に、**ホストにも1回入れる**:

```bash
cd frontend && npm ci    # ホスト。IDE 補完・型チェック用。.gitignore 済みなのでコミットに影響なし
```

- ホスト = macOS 用バイナリ（`@tailwindcss/oxide` / `@next/swc` 等）、コンテナ = Linux 用。別々に入るので混ざらない。
- `package.json` の依存を足したら、`docker compose exec frontend npm install` と `cd frontend && npm install` の**両方**を回す。
- backend は `vendor/` をホストにバインドマウントしているので、この対処は不要（Intelephense はそのまま動く）。
- ホストに Node は必要（`.nvmrc` の 22。`nvm use`）。「ホストに何も入れない」の唯一の例外がこれ。

## よく使うコマンド

```bash
docker compose up -d              # 起動
docker compose down               # 停止（データは残る）
docker compose down -v            # データごと破棄（作り直し）
docker compose logs -f backend    # ログ追尾（backend / frontend など）

docker compose exec backend php artisan migrate
docker compose exec backend php artisan test --compact
docker compose exec backend ./vendor/bin/pint --dirty
docker compose exec backend php artisan tinker

docker compose exec frontend npm run lint
docker compose exec frontend npx tsc --noEmit
```

シェルエイリアス（`alias dce='docker compose exec'` など）を各自の dotfiles に置くと楽。リポジトリには入れない。

## Laravel Boost（MCP）

ホストに PHP が無いので、MCP 起動コマンドをコンテナ経由に変える。`.mcp.json`:

```json
{
  "mcpServers": {
    "laravel-boost": {
      "command": "docker",
      "args": ["compose", "exec", "-T", "backend", "php", "artisan", "boost:mcp"]
    }
  }
}
```

`-T`（擬似 TTY を割り当てない）が無いと MCP の stdio がおかしくなる。コンテナが起動している必要がある。

## トラブルシュート

| 症状 | 対処 |
|---|---|
| frontend のファイル変更が反映されない | `WATCHPACK_POLLING=true` / `CHOKIDAR_USEPOLLING=true` を確認。まだなら `docker compose restart frontend` |
| エディタで `.tsx` 全体が「`react` が見つからない」等のエラー | ホストに `node_modules` が無い。`cd frontend && npm ci`（上記「IDE 補完のために…」）。入れた後 TS サーバー再起動 |
| `vendor` が無いと怒られる | `docker compose exec backend composer install` |
| `SQLSTATE ... could not translate host name "db"` | backend/.env の `DB_HOST` が `db` になっているか（`127.0.0.1` はコンテナ内では自分自身） |
| backend が 502 / 起動しない | `docker compose logs backend`。`APP_KEY` 未設定 or `storage/` 権限を疑う |
| ブラウザから `localhost:8000` が繋がらない | ポートマップは `8000:8080`（serversideup は 8080 リッスン）。`80` ではない |
| Linux で `storage/` に書けない | `PUID` / `PGID` を自分の uid/gid に合わせる |
| MinIO に接続できない | `AWS_ENDPOINT=http://minio:9000` と `AWS_USE_PATH_STYLE_ENDPOINT=true` |
| ポート衝突（5432 等） | ホストで別の Postgres が動いている。そちらを止めるか compose 側の公開ポートを変える |

## 本番との差分（意識しておくこと）

| | ローカル | 本番（Railway、`docs/04`） |
|---|---|---|
| backend イメージ | `serversideup/php:8.4-fpm-nginx` を直接 | 同イメージ + コード焼き込みの薄い Dockerfile |
| リクエストごとの状態 | 毎回リセット（php-fpm） | 同じ（php-fpm） |
| コード | バインドマウント（編集即反映） | イメージに焼き込み |
| opcache | `PHP_OPCACHE_ENABLE=0` | `1` |
| 起動時 artisan | `AUTORUN_ENABLED=false`（手動） | `AUTORUN_*=true`（migrate / config:cache 等を自動） |
| frontend | `next dev`（ホットリロード） | `next start`（standalone ビルド） |

backend は同一イメージ・同一アプリサーバー（php-fpm）なので、Octane のような「リクエスト間の状態リーク」を気にする必要はない。ローカルとの差は opcache と設定キャッシュくらい。DB・S3・ルーティング・認可はローカルでそのまま再現できる。

# 管理者ページ設計

方式: **Next.js に自作の `/admin`**（フロントと同じ技術・デザイン）。Laravel には管理用 API `/api/admin/*` を用意する。

## 認可

- `users.role`（`customer` / `admin`、default `customer`）。シーダーで管理者を1人作成
- `GET /api/me` は `role` を返す
- Next.js: `middleware.ts` で `/admin/*` を保護。Cookie のトークンで `/bff/me` を引き、`role !== 'admin'` なら `/` へ（存在を隠すなら 404）
- Laravel: `/api/admin/*` は `auth:sanctum` ＋ 独自 `EnsureAdmin` ミドルウェア（`$user->role === 'admin'`）
- ログインは通常の `/login` を共用（ログイン後 admin なら `/admin` へ誘導するリンクを出す程度）。専用ログイン画面は作らない

## 画面（Next.js ルート）

| パス | 内容 |
|---|---|
| `/admin` | ダッシュボード（注文件数・在庫僅少/切れの商品数・最近の注文5件） |
| `/admin/products` | 商品一覧（未公開含む、検索・カテゴリ絞り込み・ページング） |
| `/admin/products/new` | 商品新規作成 |
| `/admin/products/[id]` | 商品編集（基本情報／画像／バリアント／公開フラグ） |
| `/admin/categories` | カテゴリ一覧・追加・編集・並べ替え |
| `/admin/orders` | 注文一覧（ステータスフィルタ・ページング） |
| `/admin/orders/[number]` | 注文詳細・ステータス変更 |
| `/admin/customers` | 会員一覧（閲覧のみ、注文数・登録日、名前/メール検索） |

管理画面はモノトーンだが、ストアフロントのような装飾は排し、機能優先のテーブル/フォームレイアウト。

### 商品編集ページの構成

1. **基本情報**: name / slug / category / price / description / material / care / origin / product_code / size_chart（列名＋S/M/L の数値グリッド編集）/ is_published / position
2. **画像**: ドラッグ＆ドロップでアップロード、サムネ一覧、並べ替え（position）、削除。position 0 が主画像・1 がホバー画像
3. **バリアント**: S/M/L（アクセサリーは FREE）の行。color（任意）/ sku / stock を編集。行の追加・削除

## Laravel 管理 API（`/api/admin`、要 admin）

### ダッシュボード
| メソッド | パス | 返却 |
|---|---|---|
| GET | `/api/admin/stats` | `{ orders_count, low_stock_count, sold_out_count, recent_orders: [...] }`。売上は R2 では出さない（決済なしのため意味のある数字にならない） |

### 商品
| メソッド | パス | 備考 |
|---|---|---|
| GET | `/api/admin/products` | 未公開含む一覧。`?q=&category=&page=` |
| POST | `/api/admin/products` | 作成（画像・バリアントは別エンドポイントで付与） |
| GET | `/api/admin/products/{id}` | 編集用フル情報 |
| PUT | `/api/admin/products/{id}` | 基本情報更新 |
| DELETE | `/api/admin/products/{id}` | 削除（注文明細はスナップショットが残る。`order_items.product_id` は SET NULL） |

### 商品画像
| メソッド | パス | 備考 |
|---|---|---|
| POST | `/api/admin/products/{id}/images` | multipart。バケットへ保存＋行作成。返却は作成した image |
| PUT | `/api/admin/products/{id}/images/reorder` | `{ order: [imageId, ...] }` |
| DELETE | `/api/admin/product-images/{id}` | バケットのオブジェクトも削除 |

### バリアント
| メソッド | パス | 備考 |
|---|---|---|
| POST | `/api/admin/products/{id}/variants` | `{ size, color?, sku, stock }` |
| PUT | `/api/admin/variants/{id}` | `{ color?, sku, stock }` |
| DELETE | `/api/admin/variants/{id}` | 注文で参照済みなら stock=0 推奨（削除は SET NULL） |

### カテゴリ
| メソッド | パス |
|---|---|
| GET / POST | `/api/admin/categories` |
| PUT / DELETE | `/api/admin/categories/{id}` |
| PUT | `/api/admin/categories/reorder` |

`DELETE` は所属商品がある場合 409（FK RESTRICT）。

### 注文
| メソッド | パス | 備考 |
|---|---|---|
| GET | `/api/admin/orders` | 全ユーザーの注文。`?status=&page=` |
| GET | `/api/admin/orders/{order_number}` | 明細・配送先込み |
| PUT | `/api/admin/orders/{order_number}/status` | `{ status }`。R2 は `pending` ⇄ `cancelled`。`cancelled` にしたら在庫を戻す |

### 会員
| メソッド | パス | 備考 |
|---|---|---|
| GET | `/api/admin/customers` | `role='customer'` の一覧。注文数・登録日。`?q=`（name / email 部分一致）・`?page=` |

## 画像ストレージ（Railway バケット）

- Railway バケットは **private のみ**（public 非対応）。よって直リンクは不可
- Laravel は Flysystem の S3 ドライバでバケットに接続（`config/filesystems.php` の `s3` ディスク）
- Railway が供給する変数を Laravel 用プリセットでマッピング: `AWS_ACCESS_KEY_ID` ← `ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` ← `SECRET_ACCESS_KEY` / `AWS_DEFAULT_REGION` ← `REGION` / `AWS_BUCKET` ← `BUCKET` / `AWS_ENDPOINT` ← `ENDPOINT` / `AWS_USE_PATH_STYLE_ENDPOINT`（バケットの Credentials タブの指示に従う）

### 保存

- キー形式: `products/{product_id}/{ulid}.{ext}`（slug 変更に影響されない）
- `product_images` は `path`（キー）を保持。`url` カラムは持たず、API リソースが `url` を組み立てて返す

### 配信（メディアプロキシ）

- API リソースの `url` = `/media/products/{product_id}/{ulid}.jpg`（相対）
- Next.js に Route Handler `app/media/[...key]/route.ts`:
  1. `key` を組み立て、S3 クライアント（Next 側にバケット読み取り資格を Railway 変数参照で注入）で `GetObject`
  2. `Content-Type` を透過、`Cache-Control: public, max-age=31536000, immutable` を付けて返す
  3. 404 は 404 を返す
- `next/image` の `loader` はデフォルト（同一オリジンの `/media/...` を最適化）
- 代替案（実装で詰まったら）: Laravel が `Storage::temporaryUrl()` で presigned URL（TTL 24h）を発行し API で返す。URL が変わるため `next/image` キャッシュと相性が悪いのでプロキシを優先

## ローカル開発

- docker-compose の MinIO（S3 互換）に `s3` ディスクを向ける
- もしくは開発時は `local` ディスク（`storage/app/public`）＋ `php artisan storage:link`、本番のみ `s3`。`FILESYSTEM_DISK` 環境変数で切替

# データベース設計（PostgreSQL 16）

## ER 概要

```
categories 1─< products 1─< product_images
                      1─< product_variants
users(role) 1─< addresses
users       1─< orders 1─< order_items >─0..1 products
                                       >─0..1 product_variants
```

性別（MEN/WOMEN）の区別はなし。ユニセックス。サイズは `S` `M` `L` の3つのみ。アクセサリーはサイズ `FREE` の単一 variant。

Laravel 標準テーブル（`users`, `password_reset_tokens`, `sessions`, `cache`, `jobs`, `personal_access_tokens`）はそのまま利用。

---

## categories

| カラム | 型 | 制約 / 備考 |
|---|---|---|
| id | bigserial | PK |
| name | varchar(50) | `Tops` など |
| slug | varchar(50) | UNIQUE。`tops` など |
| position | integer | 表示順 |
| created_at / updated_at | timestamp | |

初期投入する4件（position 順）。**`CategorySeeder` で作成する**（当初は「/admin から手動」方針だったが、商品 Seeder が category を必須とするため 2026-09-04 に変更）。admin のカテゴリ管理は「この4件を編集・並べ替え・5件目を追加」で動作確認する:

| slug | name |
|---|---|
| tops | Tops |
| bottoms | Bottoms（スカート類もここ） |
| outerwear | Outerwear |
| accessories | Accessories |

URL は `/collections/{slug}`。

---

## products

| カラム | 型 | 制約 / 備考 |
|---|---|---|
| id | bigserial | PK |
| category_id | bigint | FK → categories、ON DELETE RESTRICT |
| name | varchar(120) | |
| slug | varchar(140) | UNIQUE |
| price | integer | JPY 税込。> 0 |
| description | text | 商品説明（段落） |
| material | text | 素材（例: 本体 綿100% / 刺繍糸 ポリエステル100%） |
| care | text | nullable。取扱い・洗濯表示 |
| origin | varchar(50) | 原産国（例: 中国） |
| product_code | varchar(30) | 品番（例: EC-TP0012）。表示用、variant の sku とは別 |
| size_chart | jsonb | nullable。下記フォーマット |
| is_published | boolean | default true。false は一覧・詳細・API から除外 |
| position | integer | 一覧の並び順 |
| created_at / updated_at | timestamp | |

インデックス: `category_id`, `slug`, `(is_published, position)`

### size_chart JSON フォーマット

カテゴリによって測定項目が違うため商品ごとに保持（同カテゴリは基本同じ値をシードで共有）。

```json
{
  "unit": "cm",
  "columns": ["着丈", "身幅", "肩幅", "袖丈"],
  "rows": {
    "S": [66, 52, 46, 20],
    "M": [68, 55, 48, 21],
    "L": [70, 58, 50, 22]
  }
}
```

- Bottoms 例の columns: `["ウエスト", "股上", "股下", "わたり幅", "裾幅"]`
- Accessories は `size_chart = null`

---

## product_images

| カラム | 型 | 制約 / 備考 |
|---|---|---|
| id | bigserial | PK |
| product_id | bigint | FK → products、ON DELETE CASCADE |
| path | varchar(255) | Railway バケットのオブジェクトキー。例 `products/12/01J....jpg` |
| alt | varchar(255) | |
| position | integer | 0=主画像、1=一覧ホバー画像、以降ギャラリー順 |
| created_at / updated_at | timestamp | |

インデックス: `(product_id, position)`
API リソースが `url = /media/{path}` を組み立てて返す（`docs/05-admin.md` のメディアプロキシ参照）。`url` カラムは持たない。

---

## product_variants

| カラム | 型 | 制約 / 備考 |
|---|---|---|
| id | bigserial | PK |
| product_id | bigint | FK → products、ON DELETE CASCADE |
| size | varchar(10) | `S` `M` `L`（アパレル）/ `FREE`（アクセサリー） |
| color | varchar(30) | nullable。1色のみの商品は null。色展開時のみ値を入れる |
| sku | varchar(40) | UNIQUE |
| stock | integer | >= 0 |
| position | integer | サイズ表示順（S→M→L） |
| created_at / updated_at | timestamp | |
| | | UNIQUE(product_id, size, color) |

### 在庫ステータス（API が算出、閾値はアプリ定数）

| 条件 | 表示 | セレクタ |
|---|---|---|
| `stock = 0` | `×`（SOLD OUT） | 選択不可・グレーアウト |
| `1 <= stock <= 3` | `残りわずか`（LOW STOCK） | 選択可 |
| `stock >= 4` | `在庫あり`（表示なしでも可） | 選択可 |

閾値 `LOW_STOCK_THRESHOLD = 3` は config に置く。

---

## users（Laravel 標準を拡張）

| カラム | 型 | 備考 |
|---|---|---|
| id | bigserial | PK |
| name | varchar(255) | 氏名 |
| email | varchar(255) | UNIQUE |
| email_verified_at | timestamp | nullable（R2 でも検証フローなし） |
| password | varchar(255) | bcrypt |
| role | varchar(20) | `customer` / `admin`、default `customer`。管理画面の認可に使用 |
| remember_token | varchar(100) | |
| created_at / updated_at | timestamp | |

シーダーで管理者1人（`role = 'admin'`）とダミー顧客数人を作成。

---

## addresses

| カラム | 型 | 制約 / 備考 |
|---|---|---|
| id | bigserial | PK |
| user_id | bigint | FK → users、ON DELETE CASCADE |
| recipient_name | varchar(100) | 宛名 |
| postal_code | varchar(8) | `123-4567` |
| prefecture | varchar(10) | 都道府県 |
| city | varchar(100) | 市区町村 |
| address_line1 | varchar(255) | 番地 |
| address_line2 | varchar(255) | nullable。建物名・部屋番号 |
| phone | varchar(20) | |
| is_default | boolean | default false。ユーザーごとに最大1件 true |
| created_at / updated_at | timestamp | |

インデックス: `user_id`
デフォルト設定時は同ユーザーの他レコードを false に更新（アプリ側で担保）。

---

## orders

| カラム | 型 | 制約 / 備考 |
|---|---|---|
| id | bigserial | PK |
| user_id | bigint | FK → users、ON DELETE RESTRICT |
| order_number | varchar(20) | UNIQUE。`EC-YYYYMMDD-NNNN`（日付内連番） |
| status | varchar(20) | `pending` / `cancelled`。将来 `paid` `shipped` 追加 |
| subtotal | integer | 明細合計 |
| shipping_fee | integer | 送料（¥800 または 0） |
| total | integer | subtotal + shipping_fee |
| ship_recipient_name | varchar(100) | 配送先スナップショット |
| ship_postal_code | varchar(8) | |
| ship_prefecture | varchar(10) | |
| ship_city | varchar(100) | |
| ship_address_line1 | varchar(255) | |
| ship_address_line2 | varchar(255) | nullable |
| ship_phone | varchar(20) | |
| created_at / updated_at | timestamp | |

住所は注文時点の値をコピー保持（住所録を後で編集・削除しても注文履歴は不変）。
インデックス: `user_id`, `order_number`

---

## order_items

| カラム | 型 | 制約 / 備考 |
|---|---|---|
| id | bigserial | PK |
| order_id | bigint | FK → orders、ON DELETE CASCADE |
| product_id | bigint | FK → products、ON DELETE SET NULL（nullable） |
| product_variant_id | bigint | FK → product_variants、ON DELETE SET NULL（nullable） |
| product_name | varchar(120) | スナップショット |
| variant_size | varchar(10) | スナップショット |
| variant_color | varchar(30) | nullable。スナップショット |
| image_url | varchar(255) | 主画像スナップショット |
| unit_price | integer | 注文時単価 |
| quantity | integer | > 0 |
| line_total | integer | unit_price * quantity |
| created_at / updated_at | timestamp | 他テーブルと統一のため付与 |

商品情報はスナップショットで持ち、`product_id` は参照リンク用途のみ。

---

## 注文作成トランザクション（`POST /api/orders`）

1. カート明細（`variant_id` + `quantity` の配列）と `address`（既存 id or 新規オブジェクト）を受け取る
2. トランザクション開始
3. 対象 variant を `FOR UPDATE` でロックし、`stock >= quantity` を検証。不足あれば 422 で該当明細を返却しロールバック
4. `is_published = false` の商品が含まれれば 422
5. `subtotal` を再計算（クライアント送信の金額は信用しない）、送料ルール適用（一律 ¥800、¥20,000 以上で無料）
6. `order_number` 採番（`EC-{today}-{当日連番}`）
7. `orders` / `order_items` を作成、各 variant の `stock` を減算
8. 新規住所かつ「保存」指定なら `addresses` にも作成
9. コミット、作成した order を返却

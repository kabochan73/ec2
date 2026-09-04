// ─────────────────────────────────────────────────────────────
// Laravel API のレスポンス形と対応する TypeScript 型。
// backend/app/Http/Resources 側の形と揃える（Resource を変えたらここも直す）。
// docs/08-frontend-design.md §6: 1関数専用の入力型も含めて全部このファイルに集約する。
// ─────────────────────────────────────────────────────────────

/** 単体リソースのレスポンス形。 { "data": {...} } */
export type ApiResource<T> = { data: T };

/** 一覧リソースのレスポンス形。 { "data": [...] } */
export type ApiCollection<T> = { data: T[] };

// backend/app/Http/Resources/UserResource.php
export type User = {
  id: number;
  name: string;
  email: string;
  role: "customer" | "admin";
};

// backend/app/Http/Resources/CategoryResource.php
export type Category = {
  id: number;
  name: string;
  slug: string;
  position: number;
};

/** 在庫ステータス。backend/app/Enums/StockStatus.php の値と一致させる */
export type StockStatus = "sold_out" | "low_stock" | "in_stock";

// backend/app/Http/Resources/ProductImageResource.php
export type ProductImage = {
  url: string;
  alt: string | null;
  position: number;
};

// backend/app/Http/Resources/ProductSummaryResource.php
// 商品一覧・トップページのカテゴリグリッド・関連商品で共通して使う要約形式
export type ProductSummary = {
  id: number;
  name: string;
  slug: string;
  price: number;
  category: { name: string; slug: string };
  stock_status: StockStatus;
  is_new: boolean;
  images: ProductImage[];
};

// backend/app/Http/Resources/ProductVariantResource.php（商品詳細でのみ使う。stock の生数値込み）
export type ProductVariant = {
  id: number;
  size: string;
  color: string | null;
  stock: number;
  stock_status: StockStatus;
};

// docs/02-database-design.md の size_chart JSON フォーマット
export type SizeChart = {
  unit: string;
  columns: string[];
  rows: Record<string, number[]>;
};

// backend/app/Http/Resources/ProductDetailResource.php
export type ProductDetail = {
  id: number;
  name: string;
  slug: string;
  price: number;
  category: { name: string; slug: string };
  description: string;
  material: string;
  care: string | null;
  origin: string;
  product_code: string;
  size_chart: SizeChart | null;
  is_new: boolean;
  images: ProductImage[];
  colors: string[];
  variants: ProductVariant[];
  related: ProductSummary[];
};

// backend/app/Http/Resources/AddressResource.php
export type Address = {
  id: number;
  recipient_name: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line1: string;
  address_line2: string | null;
  phone: string;
  is_default: boolean;
};

// backend/app/Enums/OrderStatus.php（R2 は pending / cancelled の2値のみ）
export type OrderStatus = "pending" | "cancelled";

// backend/app/Http/Resources/OrderSummaryResource.php（GET /api/orders）
export type OrderSummary = {
  order_number: string;
  created_at: string;
  item_count: number;
  total: number;
  status: OrderStatus;
};

// backend/app/Http/Resources/OrderItemResource.php
export type OrderItem = {
  id: number;
  product_id: number | null;
  product_name: string;
  variant_size: string;
  variant_color: string | null;
  image_url: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

// ── フロント内部の型（Laravel Resource と対応しないもの） ──────────

// lib/stores/cart.ts のカート明細1行分。
// 「追加した時点の表示スナップショット」なので、ここの値は表示の初期値でしかない
// （/cart 表示時に API で在庫・価格を再検証する）。
export type CartItem = {
  variantId: number;
  productSlug: string;
  productName: string;
  size: string;
  color: string | null;
  unitPrice: number;
  quantity: number;
  imageUrl: string;
};

// lib/hooks/useCartValidation.ts — カート明細1行の「今の本当の状態」。
export type CartLineValidation = {
  /** null = まだ取得中 */
  currentStock: number | null;
  /** null = まだ取得中 or 商品が消えている */
  currentPrice: number | null;
  /** 商品が 404（削除・未公開）/ variant が無い / 在庫0 のいずれかなら false */
  available: boolean;
};

// ── Laravel Resource 対応の型（続き）─────────────────────────

// backend/app/Http/Resources/OrderResource.php（POST /api/orders, GET /api/orders/{order_number}）
export type OrderDetail = {
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  total: number;
  shipping_address: {
    recipient_name: string;
    postal_code: string;
    prefecture: string;
    city: string;
    address_line1: string;
    address_line2: string | null;
    phone: string;
  };
  created_at: string;
  items: OrderItem[];
};

// middleware.ts（Edge Runtime、next/headers は使えない）と lib/auth.ts（Node Runtime、
// next/headers の cookies() を使う）の両方から参照するので、依存の少ない単独ファイルに置く。
export const SESSION_COOKIE_NAME = "ec_token";

// backend/config/shop.php と値を合わせる（表示用の概算計算に使う）。
// 確定額は POST /api/orders でサーバー側が再計算するので、ここがズレても実害は無い。
export const SHIPPING_FEE = 800;
export const FREE_SHIPPING_THRESHOLD = 20_000;

// 在庫ステータスのしきい値（backend/config/shop.php の low_stock_threshold）。
// 表示上の補助（詳細ページのサイズ横の "LOW STOCK" 等）に使う。
export const LOW_STOCK_THRESHOLD = 3;

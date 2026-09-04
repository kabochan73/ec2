// ─────────────────────────────────────────────────────────────
// ブラウザ（Client Component）から商品詳細を引くための BFF エンドポイント。
//
// 商品閲覧の読み取りは基本 Server Component の直 fetch（docs/08 §3.1）だが、
// カートの在庫再検証（lib/hooks/useCartValidation.ts）はクライアントで動くので、
// クライアントから叩ける URL が要る。認証は不要。
//
//   ブラウザ → GET /bff/products/{slug} → getProduct（Laravel /api/products/{slug}）
//
// 未公開・存在しない slug は 404（getProduct が null → ここで 404 に変換）。
// ─────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

import { getProduct } from "@/lib/products";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ data: product });
}

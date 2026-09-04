import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth";
import { findOrder } from "@/lib/orders";

type PageProps = {
  params: Promise<{ number: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<{ title: string }> {
  const { number } = await params;
  return { title: number };
}

/** 注文詳細（docs/01-sitemap-pages.md の `/account/orders/[number]`）。他人・存在しない番号は 404。 */
export default async function OrderDetailPage({ params }: PageProps) {
  const { number } = await params;
  const { token } = await requireAuth(`/account/orders/${number}`);

  const order = await findOrder(token, number);
  if (!order) {
    notFound();
  }

  const address = order.shipping_address;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <nav className="mb-8 text-[11px] tracking-widest text-graphite uppercase">
        <Link href="/account/orders" className="hover:text-ink">
          Orders
        </Link>
        <span className="mx-2">/</span>
        <span>{order.order_number}</span>
      </nav>

      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl tracking-[0.15em] uppercase">{order.order_number}</h1>
        <span className="text-xs tracking-widest text-graphite uppercase">{order.status}</span>
      </div>
      <p className="mt-1 text-xs text-graphite">
        {new Date(order.created_at).toLocaleString("ja-JP")}
      </p>

      {/* 明細 */}
      <div className="mt-10 divide-y divide-mist border-t border-b border-ink">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-4 py-4">
            <div className="relative aspect-3/4 w-16 flex-none bg-mist">
              {/* image_url は画像ゼロ商品だと空文字。next/image に空文字を渡さない */}
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.product_name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-[7px] tracking-widest text-graphite uppercase">
                  No Image
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <p className="text-sm">{item.product_name}</p>
              <p className="mt-1 text-xs tracking-widest text-graphite uppercase">
                {item.variant_size}
                {item.variant_color ? ` / ${item.variant_color}` : ""} × {item.quantity}
              </p>
            </div>
            <p className="w-20 flex-none self-center text-right text-sm">
              ¥{item.line_total.toLocaleString("ja-JP")}
            </p>
          </div>
        ))}
      </div>

      {/* 金額 */}
      <div className="mt-6 ml-auto w-full max-w-xs text-xs tracking-widest uppercase">
        <div className="flex justify-between py-2">
          <span>Subtotal</span>
          <span>¥{order.subtotal.toLocaleString("ja-JP")}</span>
        </div>
        <div className="flex justify-between border-t border-mist py-2">
          <span>Shipping</span>
          <span>
            {order.shipping_fee === 0
              ? "Free"
              : `¥${order.shipping_fee.toLocaleString("ja-JP")}`}
          </span>
        </div>
        <div className="flex justify-between border-t border-ink py-3 text-sm normal-case">
          <span>Total</span>
          <span>¥{order.total.toLocaleString("ja-JP")}</span>
        </div>
      </div>

      {/* 配送先スナップショット */}
      <section className="mt-10 border border-ink p-6">
        <h2 className="text-[11px] tracking-widest text-graphite uppercase">Shipping Address</h2>
        <div className="mt-3 text-sm leading-relaxed">
          <p>{address.recipient_name}</p>
          <p>
            〒{address.postal_code} {address.prefecture}
            {address.city}
          </p>
          <p>
            {address.address_line1}
            {address.address_line2 ? ` ${address.address_line2}` : ""}
          </p>
          <p>{address.phone}</p>
        </div>
      </section>
    </div>
  );
}

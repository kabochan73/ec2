import Link from "next/link";
import { notFound } from "next/navigation";

import OrderStatusToggle from "@/components/admin/OrderStatusToggle";
import { fetchAdminOrder } from "@/lib/admin/orders";
import { ApiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

type PageProps = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: PageProps): Promise<{ title: string }> {
  const { number } = await params;
  return { title: `${number} | Admin` };
}

/**
 * 注文詳細・ステータス変更（docs/05-admin.md）。公開側と違い customer 情報を表示し、
 * 全ユーザーの注文番号が対象（本人確認は無い）。
 */
export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { number } = await params;
  const { token } = await requireAdmin(`/admin/orders/${number}`);

  let order;
  try {
    order = await fetchAdminOrder(token, number);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const address = order.shipping_address;

  return (
    <div className="max-w-3xl">
      <nav className="mb-8 text-[11px] tracking-widest text-graphite uppercase">
        <Link href="/admin/orders" className="hover:text-ink">
          Orders
        </Link>
        <span className="mx-2">/</span>
        <span>{order.order_number}</span>
      </nav>

      <div className="flex items-baseline justify-between">
        <h1 className="text-xl tracking-widest uppercase">{order.order_number}</h1>
        <span className="text-xs tracking-widest text-graphite uppercase">{order.status}</span>
      </div>
      <p className="mt-1 text-xs text-graphite">
        {new Date(order.created_at).toLocaleString("ja-JP")}
      </p>

      {/* 会員情報 */}
      <section className="mt-6 border border-ink p-4 text-sm">
        <p className="text-[11px] tracking-widest text-graphite uppercase">Customer</p>
        <p className="mt-2">{order.customer.name}</p>
        <p className="text-graphite">{order.customer.email}</p>
      </section>

      {/* 明細 */}
      <div className="mt-10 divide-y divide-mist border-t border-b border-ink">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 py-4">
            <div className="flex-1">
              <p className="text-sm">{item.product_name}</p>
              <p className="mt-1 text-xs tracking-widest text-graphite uppercase">
                {item.variant_size}
                {item.variant_color ? ` / ${item.variant_color}` : ""} × {item.quantity}
              </p>
            </div>
            <p className="w-20 flex-none text-right text-sm">
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
            {order.shipping_fee === 0 ? "Free" : `¥${order.shipping_fee.toLocaleString("ja-JP")}`}
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
            〒{address.postal_code} {address.prefecture} {address.city}
          </p>
          <p>
            {address.address_line1}
            {address.address_line2 ? ` ${address.address_line2}` : ""}
          </p>
          <p>{address.phone}</p>
        </div>
      </section>

      <div className="mt-10">
        <OrderStatusToggle orderNumber={order.order_number} status={order.status} />
      </div>
    </div>
  );
}

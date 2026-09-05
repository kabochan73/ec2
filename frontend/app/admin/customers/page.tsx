import type { Metadata } from "next";
import Link from "next/link";

import { fetchAdminCustomers } from "@/lib/admin/customers";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Customers | Admin" };

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

/** 会員一覧（閲覧のみ。docs/05-admin.md）。 */
export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const { token } = await requireAdmin("/admin/customers");
  const { page } = await searchParams;
  const currentPage = page ? Number(page) : 1;

  const result = await fetchAdminCustomers(token, currentPage);

  return (
    <div>
      <h1 className="mb-8 text-xl tracking-widest uppercase">Customers</h1>

      {result.data.length === 0 ? (
        <p className="text-sm text-graphite">No customers found.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink text-left text-[11px] tracking-widest text-graphite uppercase">
              <th className="py-2 font-normal">Name</th>
              <th className="py-2 font-normal">Email</th>
              <th className="py-2 font-normal">Registered</th>
              <th className="py-2 text-right font-normal">Orders</th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((customer) => (
              <tr key={customer.id} className="border-b border-mist">
                <td className="py-2">{customer.name}</td>
                <td className="py-2 text-graphite">{customer.email}</td>
                <td className="py-2 text-graphite">
                  {new Date(customer.created_at).toLocaleDateString("ja-JP")}
                </td>
                <td className="py-2 text-right">{customer.orders_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {result.meta.last_page > 1 && (
        <div className="mt-6 flex items-center gap-4 text-xs tracking-widest uppercase">
          {result.meta.current_page > 1 ? (
            <Link href={`/admin/customers?page=${result.meta.current_page - 1}`} className="hover:underline">
              Prev
            </Link>
          ) : (
            <span className="text-graphite">Prev</span>
          )}
          <span>
            {result.meta.current_page} / {result.meta.last_page}
          </span>
          {result.meta.current_page < result.meta.last_page ? (
            <Link href={`/admin/customers?page=${result.meta.current_page + 1}`} className="hover:underline">
              Next
            </Link>
          ) : (
            <span className="text-graphite">Next</span>
          )}
        </div>
      )}
    </div>
  );
}

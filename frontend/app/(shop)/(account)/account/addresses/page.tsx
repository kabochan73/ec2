import type { Metadata } from "next";

import AddressBook from "@/components/account/AddressBook";
import { fetchAddresses } from "@/lib/addresses";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = { title: "Addresses" };

/**
 * 住所録（docs/01-sitemap-pages.md の `/account/addresses`）。
 * Server Component で初期一覧を取り、以降の CRUD は AddressBook（CC）が担当。
 */
export default async function AddressesPage() {
  const { token } = await requireAuth("/account/addresses");
  const addresses = await fetchAddresses(token);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-10 text-2xl tracking-[0.15em] uppercase">Addresses</h1>
      <AddressBook initialAddresses={addresses} />
    </div>
  );
}

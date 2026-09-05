"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import Field from "@/components/ui/Field";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";
import { useCartValidation } from "@/lib/hooks/useCartValidation";
import { addressSchema, type AddressFormValues } from "@/lib/schemas/address";
import { useCartStore } from "@/lib/stores/cart";
import type { Address, ApiCollection, ApiResource, OrderDetail } from "@/lib/types";

/**
 * チェックアウト（docs/01-sitemap-pages.md の `/checkout`。決済ステップなし）。
 * カートは zustand（localStorage）にしか無いのでページ丸ごと CC。
 * middleware で未ログインは弾かれるが、注文 API も認証必須。
 */
export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const { getValidation, loading: validating } = useCartValidation(items);

  // --- 配送先: 住所録 ---
  const { data: addresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: async (): Promise<Address[]> => {
      const res = await fetch("/bff/addresses");
      if (!res.ok) {
        throw new Error("住所録の取得に失敗しました。");
      }
      const body: ApiCollection<Address> = await res.json();
      return body.data;
    },
  });

  const [addressMode, setAddressMode] = useState<"existing" | "new">("existing");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);
  const [selectionInitialized, setSelectionInitialized] = useState(false);

  useEffect(() => {
    if (!addresses || selectionInitialized) {
      return;
    }
    if (addresses.length === 0) {
      setAddressMode("new");
    } else {
      const defaultAddress = addresses.find((address) => address.is_default) ?? addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
    setSelectionInitialized(true);
  }, [addresses, selectionInitialized]);

  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<AddressFormValues>({ resolver: zodResolver(addressSchema) });

  // --- 注文内容（送料ルールは /cart と同じ） ---
  const lines = items.map((item) => {
    const validation = getValidation(item);
    const price = validation.currentPrice ?? item.unitPrice;
    return { item, validation, price, lineTotal: price * item.quantity };
  });
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;
  const hasUnavailable = lines.some(
    (line) =>
      !line.validation.available ||
      (line.validation.currentStock !== null &&
        line.item.quantity > line.validation.currentStock),
  );

  // --- 注文確定 ---
  const [placing, setPlacing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [unavailableVariantIds, setUnavailableVariantIds] = useState<number[]>([]);

  async function handlePlaceOrder() {
    setSubmitError(null);
    setUnavailableVariantIds([]);

    let addressFields: {
      address_id?: number;
      address?: AddressFormValues;
      save_address?: boolean;
    };

    if (addressMode === "existing") {
      if (!selectedAddressId) {
        setSubmitError("配送先を選択してください。");
        return;
      }
      addressFields = { address_id: selectedAddressId };
    } else {
      const valid = await trigger();
      if (!valid) {
        return;
      }
      addressFields = { address: getValues(), save_address: saveAddress };
    }

    setPlacing(true);
    const res = await fetch("/bff/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
        ...addressFields,
      }),
    });
    setPlacing(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      if (Array.isArray(body?.unavailable)) {
        setUnavailableVariantIds(
          body.unavailable.map((u: { variant_id: number }) => u.variant_id),
        );
      }
      setSubmitError(body?.message ?? "注文に失敗しました。");
      return;
    }

    const body = (await res.json()) as ApiResource<OrderDetail>;
    clearCart();
    router.push(`/checkout/complete?order=${body.data.order_number}`);
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-32 text-center">
        <p className="text-sm tracking-widest text-graphite uppercase">Your Cart Is Empty</p>
        <Link
          href="/"
          className="mt-6 inline-block border border-ink px-6 py-3 text-xs tracking-widest uppercase transition-colors hover:bg-mist"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-10 text-2xl tracking-[0.15em] uppercase">Checkout</h1>

      <div className="grid gap-12 md:grid-cols-3">
        <div className="space-y-10 md:col-span-2">
          {/* 1. 配送先 */}
          <section>
            <h2 className="mb-4 text-[11px] tracking-widest text-graphite uppercase">
              Shipping Address
            </h2>

            {addresses && addresses.length > 0 && (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`block cursor-pointer border p-4 text-sm ${
                      addressMode === "existing" && selectedAddressId === address.id
                        ? "border-ink"
                        : "border-mist"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      className="mr-3"
                      checked={addressMode === "existing" && selectedAddressId === address.id}
                      onChange={() => {
                        setAddressMode("existing");
                        setSelectedAddressId(address.id);
                      }}
                    />
                    {address.recipient_name} — 〒{address.postal_code} {address.prefecture}{" "}
                    {address.city} {address.address_line1}
                    {address.address_line2 ? ` ${address.address_line2}` : ""}
                    {address.is_default && (
                      <span className="ml-2 text-[11px] tracking-widest text-graphite uppercase">
                        Default
                      </span>
                    )}
                  </label>
                ))}

                <button
                  type="button"
                  onClick={() => setAddressMode("new")}
                  className={`block w-full border p-4 text-left text-xs tracking-widest uppercase ${
                    addressMode === "new" ? "border-ink" : "border-mist text-graphite"
                  }`}
                >
                  + Use A New Address
                </button>
              </div>
            )}

            {addressMode === "new" && (
              <div className="mt-4 space-y-4 border border-ink p-6">
                <Field
                  label="Recipient Name"
                  id="co_recipient_name"
                  error={errors.recipient_name?.message}
                  {...register("recipient_name")}
                />
                <Field
                  label="Postal Code（例: 123-4567）"
                  id="co_postal_code"
                  placeholder="123-4567"
                  error={errors.postal_code?.message}
                  {...register("postal_code")}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Prefecture"
                    id="co_prefecture"
                    error={errors.prefecture?.message}
                    {...register("prefecture")}
                  />
                  <Field
                    label="City"
                    id="co_city"
                    error={errors.city?.message}
                    {...register("city")}
                  />
                </div>
                <Field
                  label="Address Line 1"
                  id="co_address_line1"
                  error={errors.address_line1?.message}
                  {...register("address_line1")}
                />
                <Field
                  label="Address Line 2（任意）"
                  id="co_address_line2"
                  error={errors.address_line2?.message}
                  {...register("address_line2")}
                />
                <Field
                  label="Phone"
                  id="co_phone"
                  error={errors.phone?.message}
                  {...register("phone")}
                />

                <label className="flex items-center gap-2 text-xs tracking-widest text-graphite uppercase">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                  />
                  Save To Address Book
                </label>
              </div>
            )}
          </section>

          {/* 2. 注文内容の確認（数量変更は /cart に戻って行う） */}
          <section>
            <h2 className="mb-4 text-[11px] tracking-widest text-graphite uppercase">Order Items</h2>
            <div className="divide-y divide-mist border-t border-b border-ink">
              {lines.map(({ item, validation, lineTotal }) => (
                <div key={item.variantId} className="flex items-center gap-4 py-4">
                  <div className="flex-1">
                    <p className="text-sm">{item.productName}</p>
                    <p className="mt-1 text-xs tracking-widest text-graphite uppercase">
                      {item.size}
                      {item.color ? ` / ${item.color}` : ""} × {item.quantity}
                    </p>
                    {!validation.available && (
                      <p className="mt-1 text-xs tracking-widest uppercase">Sold Out</p>
                    )}
                    {validation.available &&
                      validation.currentStock !== null &&
                      item.quantity > validation.currentStock && (
                        <p className="mt-1 text-xs text-graphite">
                          Only {validation.currentStock} left in stock.
                        </p>
                      )}
                    {unavailableVariantIds.includes(item.variantId) && (
                      <p className="mt-1 text-xs text-graphite">
                        在庫が不足しています。数量を減らすか一度カートに戻ってください。
                      </p>
                    )}
                  </div>
                  <p className="w-20 flex-none text-right text-sm">
                    ¥{lineTotal.toLocaleString("ja-JP")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* サマリー */}
        <div className="h-fit border border-ink p-6 text-xs tracking-widest uppercase">
          <div className="flex justify-between py-2">
            <span>Subtotal</span>
            <span>¥{subtotal.toLocaleString("ja-JP")}</span>
          </div>
          <div className="flex justify-between border-t border-mist py-2">
            <span>Shipping</span>
            <span>{shippingFee === 0 ? "Free" : `¥${shippingFee.toLocaleString("ja-JP")}`}</span>
          </div>
          <div className="flex justify-between border-t border-ink py-3 text-sm normal-case">
            <span>Total</span>
            <span>¥{total.toLocaleString("ja-JP")}</span>
          </div>

          {submitError && <p className="mt-4 text-xs normal-case text-graphite">{submitError}</p>}

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={hasUnavailable || validating || placing}
            className={`mt-4 block w-full py-3 text-center text-xs tracking-widest text-paper uppercase transition-opacity ${
              hasUnavailable || validating || placing
                ? "pointer-events-none bg-graphite"
                : "bg-ink hover:opacity-80"
            }`}
          >
            {placing ? "..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

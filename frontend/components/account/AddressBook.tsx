"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import AddressForm, { type AddressFormValues } from "@/components/account/AddressForm";
import type { Address, ApiCollection } from "@/lib/types";

type AddressBookProps = {
  initialAddresses: Address[];
};

// フォームを開いていない / 新規追加中 / 編集中
type Mode = { type: "idle" } | { type: "adding" } | { type: "editing"; id: number };

/**
 * 住所録の CRUD 一式（一覧・追加・編集・削除・デフォルト設定）。
 * ページ本体は Server Component で初期一覧だけ渡し、書き込み操作はここから /bff/addresses 系へ。
 *
 * 更新のたびにローカル state をつぎはぎするより、成功後に一覧をまるごと取り直す方が
 * 「is_default が他の住所からも外れる」等の副作用を正しく反映できて確実
 * （カートの再検証と同じくシンプルさ優先。react-query は使わない — 一覧が他の画面と共有されないため）。
 */
export default function AddressBook({ initialAddresses }: AddressBookProps) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [mode, setMode] = useState<Mode>({ type: "idle" });
  const [error, setError] = useState<string | null>(null);

  async function refetch() {
    const res = await fetch("/bff/addresses");
    if (res.ok) {
      const body: ApiCollection<Address> = await res.json();
      setAddresses(body.data);
    }
  }

  /** fetch → 失敗ならエラー文をセットして false、成功なら true */
  async function send(url: string, init: RequestInit, failMessage: string): Promise<boolean> {
    setError(null);
    const res = await fetch(url, init);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? failMessage);
      return false;
    }
    return true;
  }

  async function handleCreate(values: AddressFormValues) {
    const ok = await send(
      "/bff/addresses",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) },
      "登録に失敗しました。",
    );
    if (!ok) return;
    await refetch();
    setMode({ type: "idle" });
    router.refresh(); // /checkout の住所選択など他画面にも波及
  }

  async function handleUpdate(id: number, values: AddressFormValues) {
    const ok = await send(
      `/bff/addresses/${id}`,
      { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) },
      "更新に失敗しました。",
    );
    if (!ok) return;
    await refetch();
    setMode({ type: "idle" });
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (!window.confirm("この住所を削除しますか？")) return;
    const ok = await send(`/bff/addresses/${id}`, { method: "DELETE" }, "削除に失敗しました。");
    if (!ok) return;
    await refetch();
    router.refresh();
  }

  async function handleSetDefault(id: number) {
    const ok = await send(`/bff/addresses/${id}/default`, { method: "POST" }, "設定に失敗しました。");
    if (!ok) return;
    await refetch();
    router.refresh();
  }

  const editingAddress =
    mode.type === "editing" ? addresses.find((address) => address.id === mode.id) : undefined;

  return (
    <div>
      {error && <p className="mb-6 text-xs text-graphite">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        {addresses.map((address) => (
          <div key={address.id} className="border border-ink p-6">
            {address.is_default && (
              <p className="mb-2 text-[11px] tracking-widest uppercase">Default</p>
            )}
            <div className="text-sm leading-relaxed">
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

            {mode.type === "editing" && mode.id === address.id ? (
              <AddressForm
                initialValues={editingAddress}
                onSubmit={(values) => handleUpdate(address.id, values)}
                onCancel={() => setMode({ type: "idle" })}
              />
            ) : (
              <div className="mt-4 flex flex-wrap gap-4 text-xs tracking-widest uppercase">
                <button
                  type="button"
                  onClick={() => setMode({ type: "editing", id: address.id })}
                  className="underline underline-offset-2 hover:text-graphite"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(address.id)}
                  className="underline underline-offset-2 hover:text-graphite"
                >
                  Delete
                </button>
                {!address.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id)}
                    className="underline underline-offset-2 hover:text-graphite"
                  >
                    Set As Default
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {mode.type === "adding" ? (
        <AddressForm onSubmit={handleCreate} onCancel={() => setMode({ type: "idle" })} />
      ) : (
        <button
          type="button"
          onClick={() => setMode({ type: "adding" })}
          className="mt-6 border border-ink px-6 py-3 text-xs tracking-widest uppercase transition-colors hover:bg-mist"
        >
          Add New Address
        </button>
      )}
    </div>
  );
}

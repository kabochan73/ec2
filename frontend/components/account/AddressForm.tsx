"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import Field from "@/components/ui/Field";
import { addressSchema, type AddressFormValues } from "@/lib/schemas/address";
import type { Address } from "@/lib/types";

export type { AddressFormValues };

type AddressFormProps = {
  /** 編集時は既存住所、新規作成時は undefined */
  initialValues?: Address;
  onSubmit: (values: AddressFormValues) => Promise<void>;
  onCancel: () => void;
};

/**
 * 住所の新規追加・編集で共用するフォーム。is_default はここでは扱わない
 * （新規は保存後に AddressBook 側の「Set As Default」で。既存は一覧の操作で）。
 * 送信後の一覧再取得・フォームを閉じる処理は呼び出し元（AddressBook）に任せる。
 */
export default function AddressForm({ initialValues, onSubmit, onCancel }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialValues
      ? {
          recipient_name: initialValues.recipient_name,
          postal_code: initialValues.postal_code,
          prefecture: initialValues.prefecture,
          city: initialValues.city,
          address_line1: initialValues.address_line1,
          address_line2: initialValues.address_line2 ?? "",
          phone: initialValues.phone,
        }
      : undefined,
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mt-4 space-y-4 border border-ink p-6"
    >
      <Field
        label="Recipient Name"
        id="recipient_name"
        error={errors.recipient_name?.message}
        {...register("recipient_name")}
      />
      <Field
        label="Postal Code（例: 123-4567）"
        id="postal_code"
        placeholder="123-4567"
        error={errors.postal_code?.message}
        {...register("postal_code")}
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Prefecture"
          id="prefecture"
          error={errors.prefecture?.message}
          {...register("prefecture")}
        />
        <Field label="City" id="city" error={errors.city?.message} {...register("city")} />
      </div>
      <Field
        label="Address Line 1"
        id="address_line1"
        error={errors.address_line1?.message}
        {...register("address_line1")}
      />
      <Field
        label="Address Line 2（任意）"
        id="address_line2"
        error={errors.address_line2?.message}
        {...register("address_line2")}
      />
      <Field label="Phone" id="phone" error={errors.phone?.message} {...register("phone")} />

      <div className="flex gap-4 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-ink px-6 py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {isSubmitting ? "..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 text-xs tracking-widest text-graphite uppercase hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

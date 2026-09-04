<?php

namespace App\Http\Requests\Order;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    /**
     * 自分の注文を作るだけなので、認証済み（auth:sanctum）であれば誰でも良い。
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * ここでは形式的な検証のみ。在庫充足・公開状態のように DB の最新状態と
     * 競合しうるチェックは CreateOrder Action 側（トランザクション内）で行う
     * （docs/06 §11: FormRequest と Action の役割分担）。
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:'.config('shop.cart_max_quantity_per_line')],

            // address_id か address のどちらか必須。両方来た場合は Action 側で address_id を優先する
            'address_id' => [
                'nullable', 'required_without:address', 'integer',
                Rule::exists('addresses', 'id')->where('user_id', $this->user()->id),
            ],
            'address' => ['nullable', 'required_without:address_id', 'array'],
            'address.recipient_name' => ['required_with:address', 'string', 'max:100'],
            'address.postal_code' => ['required_with:address', 'string', 'regex:/^\d{3}-\d{4}$/'],
            'address.prefecture' => ['required_with:address', 'string', 'max:10'],
            'address.city' => ['required_with:address', 'string', 'max:100'],
            'address.address_line1' => ['required_with:address', 'string', 'max:255'],
            'address.address_line2' => ['nullable', 'string', 'max:255'],
            'address.phone' => ['required_with:address', 'string', 'max:20'],

            'save_address' => ['nullable', 'boolean'],
        ];
    }
}

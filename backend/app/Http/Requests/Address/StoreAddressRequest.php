<?php

namespace App\Http\Requests\Address;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAddressRequest extends FormRequest
{
    /**
     * 自分の住所録に追加するだけなので、認証済み（auth:sanctum）であれば誰でも良い。
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'recipient_name' => ['required', 'string', 'max:100'],
            'postal_code' => ['required', 'string', 'regex:/^\d{3}-\d{4}$/'],
            'prefecture' => ['required', 'string', 'max:10'],
            'city' => ['required', 'string', 'max:100'],
            'address_line1' => ['required', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }
}

<?php

namespace App\Http\Requests\Address;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAddressRequest extends FormRequest
{
    /**
     * 本人の住所のみ操作可能（docs/03-api.md）。他人の住所 ID を指定された場合は
     * 「存在しない」のと同じ見え方にするため 403 ではなく 404 を返す
     * （存在有無を探索されないようにする。docs/03 の「他人の注文は 404」と同じ方針）。
     */
    public function authorize(): bool
    {
        abort_unless($this->route('address')?->user_id === $this->user()->id, 404);

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

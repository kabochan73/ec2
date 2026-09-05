<?php

namespace App\Http\Requests\Admin\ProductImage;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductImageRequest extends FormRequest
{
    /**
     * admin ロールであることは EnsureAdmin ミドルウェアで確認済み。
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
            // max は KB 単位。5MB
            'image' => ['required', 'image', 'max:5120'],
            'alt' => ['nullable', 'string', 'max:255'],
        ];
    }
}

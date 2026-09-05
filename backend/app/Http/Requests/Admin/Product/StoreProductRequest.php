<?php

namespace App\Http\Requests\Admin\Product;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
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
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:140', 'unique:products,slug'],
            'price' => ['required', 'integer', 'min:1'],
            'description' => ['required', 'string'],
            'material' => ['required', 'string'],
            'care' => ['nullable', 'string'],
            'origin' => ['required', 'string', 'max:50'],
            'product_code' => ['required', 'string', 'max:30'],
            'size_chart' => ['nullable', 'array'],
            'is_published' => ['required', 'boolean'],
            'position' => ['required', 'integer'],
        ];
    }
}

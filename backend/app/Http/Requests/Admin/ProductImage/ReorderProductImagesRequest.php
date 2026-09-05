<?php

namespace App\Http\Requests\Admin\ProductImage;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ReorderProductImagesRequest extends FormRequest
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
            'order' => ['required', 'array'],
            'order.*' => ['integer', Rule::exists('product_images', 'id')],
        ];
    }

    /**
     * 渡された id が全部この商品の画像であることを確認する（他の商品の画像を混ぜられないように）。
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $product = $this->route('product');
            $order = (array) $this->input('order', []);

            $ownedCount = $product->images()->whereIn('id', $order)->count();

            if ($ownedCount !== count($order)) {
                $validator->errors()->add('order', 'この商品に属さない画像が含まれています。');
            }
        });
    }
}

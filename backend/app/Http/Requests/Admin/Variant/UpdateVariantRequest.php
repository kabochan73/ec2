<?php

namespace App\Http\Requests\Admin\Variant;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateVariantRequest extends FormRequest
{
    /**
     * admin ロールであることは EnsureAdmin ミドルウェアで確認済み。
     * size は変更不可（docs/05-admin.md）なのでここには無い。
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
            'color' => ['nullable', 'string', 'max:30'],
            'sku' => [
                'required',
                'string',
                'max:40',
                Rule::unique('product_variants', 'sku')->ignore($this->route('variant')),
            ],
            'stock' => ['required', 'integer', 'min:0'],
        ];
    }

    /**
     * color を変更した結果、同じ商品内の別 variant と size + color が重複しないかを確認する。
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $variant = $this->route('variant');
            $color = $this->input('color');

            $exists = $variant->product->variants()
                ->whereKeyNot($variant->id)
                ->where('size', $variant->size)
                ->when(
                    $color !== null,
                    fn ($query) => $query->where('color', $color),
                    fn ($query) => $query->whereNull('color'),
                )
                ->exists();

            if ($exists) {
                $validator->errors()->add('color', 'このサイズ・カラーの組み合わせは既に存在します。');
            }
        });
    }
}

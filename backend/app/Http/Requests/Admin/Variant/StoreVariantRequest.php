<?php

namespace App\Http\Requests\Admin\Variant;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreVariantRequest extends FormRequest
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
            'size' => ['required', Rule::in(['S', 'M', 'L', 'FREE'])],
            'color' => ['nullable', 'string', 'max:30'],
            'sku' => ['required', 'string', 'max:40', 'unique:product_variants,sku'],
            'stock' => ['required', 'integer', 'min:0'],
        ];
    }

    /**
     * 同じ商品内で size + color の組み合わせが重複していないかを確認する
     * （product_variants の複合 UNIQUE 制約と同じ条件。docs/02-database-design.md）。
     * DB 制約に任せて QueryException を捕まえるより、事前チェックの方がフォームに素直に返せる。
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $product = $this->route('product');
            $color = $this->input('color');

            $exists = $product->variants()
                ->where('size', $this->input('size'))
                ->when(
                    $color !== null,
                    fn ($query) => $query->where('color', $color),
                    fn ($query) => $query->whereNull('color'),
                )
                ->exists();

            if ($exists) {
                $validator->errors()->add('size', 'このサイズ・カラーの組み合わせは既に存在します。');
            }
        });
    }
}

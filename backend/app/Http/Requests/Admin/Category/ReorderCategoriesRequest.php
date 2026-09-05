<?php

namespace App\Http\Requests\Admin\Category;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ReorderCategoriesRequest extends FormRequest
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
            // 表示させたい順に並んだ全カテゴリの id 配列。position は配列の添字（0始まり）で決まる
            'order' => ['required', 'array'],
            'order.*' => ['integer', 'exists:categories,id'],
        ];
    }
}

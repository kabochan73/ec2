<?php

namespace App\Http\Requests\Admin\Order;

use App\Enums\OrderStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateOrderStatusRequest extends FormRequest
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
            // R2 は pending / cancelled の2値のみ（OrderStatus enum。docs/05-admin.md）
            'status' => ['required', new Enum(OrderStatus::class)],
        ];
    }
}

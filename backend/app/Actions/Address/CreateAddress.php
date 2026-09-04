<?php

namespace App\Actions\Address;

use App\Models\Address;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * 住所の新規作成。is_default=true が来たら既存の他の住所を false にする
 * （docs/02-database-design.md: 「ユーザーごとに最大1件 true」はアプリ側で担保）。
 */
final class CreateAddress
{
    /**
     * @param  array<string, mixed>  $attributes  StoreAddressRequest::validated() をそのまま渡す想定
     */
    public function execute(User $user, array $attributes): Address
    {
        return DB::transaction(function () use ($user, $attributes) {
            if ($attributes['is_default'] ?? false) {
                $user->addresses()->update(['is_default' => false]);
            }

            return $user->addresses()->create($attributes);
        });
    }
}

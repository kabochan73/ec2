<?php

namespace App\Actions\Address;

use App\Models\Address;
use Illuminate\Support\Facades\DB;

/**
 * 住所の更新。is_default=true が来たら自分以外の住所を false にする。
 */
final class UpdateAddress
{
    /**
     * @param  array<string, mixed>  $attributes  UpdateAddressRequest::validated() をそのまま渡す想定
     */
    public function execute(Address $address, array $attributes): Address
    {
        return DB::transaction(function () use ($address, $attributes) {
            if ($attributes['is_default'] ?? false) {
                $address->user->addresses()->whereKeyNot($address->id)->update(['is_default' => false]);
            }

            $address->update($attributes);

            return $address;
        });
    }
}

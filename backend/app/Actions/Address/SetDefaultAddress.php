<?php

namespace App\Actions\Address;

use App\Models\Address;
use Illuminate\Support\Facades\DB;

/**
 * POST /api/addresses/{id}/default 用。指定した住所をデフォルトにし、他を全て解除する。
 */
final class SetDefaultAddress
{
    public function execute(Address $address): Address
    {
        return DB::transaction(function () use ($address) {
            $address->user->addresses()->whereKeyNot($address->id)->update(['is_default' => false]);
            $address->update(['is_default' => true]);

            return $address;
        });
    }
}

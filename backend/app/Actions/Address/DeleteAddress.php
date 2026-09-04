<?php

namespace App\Actions\Address;

use App\Models\Address;

/**
 * 住所の削除。デフォルト住所を削除しても、他の住所への自動昇格は行わない
 * （docs/03-api.md に明記が無いため。必要になれば別途仕様化する）。
 */
final class DeleteAddress
{
    public function execute(Address $address): void
    {
        $address->delete();
    }
}

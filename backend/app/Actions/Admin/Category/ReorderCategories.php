<?php

namespace App\Actions\Admin\Category;

use App\Models\Category;
use Illuminate\Support\Facades\DB;

final class ReorderCategories
{
    /**
     * @param  list<int>  $orderedIds  表示させたい順に並んだ全カテゴリの id
     */
    public function execute(array $orderedIds): void
    {
        DB::transaction(function () use ($orderedIds) {
            foreach ($orderedIds as $position => $id) {
                Category::whereKey($id)->update(['position' => $position]);
            }
        });
    }
}

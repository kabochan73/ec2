<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'position',
    ];

    /**
     * このカテゴリに属する商品（複数）。
     * カテゴリ削除は products が RESTRICT のため、商品が残っている限り DB が防いでくれる。
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}

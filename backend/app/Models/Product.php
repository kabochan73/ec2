<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'price',
        'description',
        'material',
        'care',
        'origin',
        'product_code',
        'size_chart',
        'is_published',
        'position',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'integer',
            // カテゴリごとに測定項目が違う size_chart は jsonb 列。PHP 側では連想配列として扱う
            'size_chart' => 'array',
            'is_published' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * 商品画像（複数）。商品削除時に一緒に削除される（DB 側 CASCADE）。
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class);
    }

    /**
     * サイズ・色違いの在庫単位（複数）。商品削除時に一緒に削除される（DB 側 CASCADE）。
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * 公開中の商品のみに絞る。公開 API のクエリで使う（管理 API は全件対象なので使わない）。
     */
    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('is_published', true);
    }
}

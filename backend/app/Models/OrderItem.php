<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'order_id',
        'product_id',
        'product_variant_id',
        // ここから下は注文時点のスナップショット（商品名・サイズ等が後で変わっても不変にする）
        'product_name',
        'variant_size',
        'variant_color',
        'image_url',
        'unit_price',
        'quantity',
        'line_total',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'unit_price' => 'integer',
            'quantity' => 'integer',
            'line_total' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * 参照リンク用途のみ（表示は product_name 等のスナップショット列を使う）。
     * 商品削除後は null になる（DB 側 SET NULL）。
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * 参照リンク用途のみ。variant 削除後は null になる（DB 側 SET NULL）。
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }
}

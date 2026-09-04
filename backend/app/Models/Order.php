<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'order_number',
        'status',
        'subtotal',
        'shipping_fee',
        'total',
        // 配送先スナップショット（注文時点の住所をコピー保持）
        'ship_recipient_name',
        'ship_postal_code',
        'ship_prefecture',
        'ship_city',
        'ship_address_line1',
        'ship_address_line2',
        'ship_phone',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'subtotal' => 'integer',
            'shipping_fee' => 'integer',
            'total' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 注文明細（複数）。注文削除時に一緒に削除される（DB 側 CASCADE）。
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}

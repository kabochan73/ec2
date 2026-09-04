<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'recipient_name',
        'postal_code',
        'prefecture',
        'city',
        'address_line1',
        'address_line2',
        'phone',
        'is_default',
    ];

    /**
     * DB の is_default 列は default(false) だが、それは INSERT 時に DB 側で決まる値であり、
     * create() で明示的に渡さなかった場合、保存直後の PHP インスタンスには反映されない
     * （$this->is_default が null のまま返る）。User::$attributes の role ミラーと同じ対処。
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'is_default' => false,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

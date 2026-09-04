<?php

namespace App\Enums;

/**
 * 注文のステータス。R2 は決済を扱わないため pending / cancelled の2値のみ。
 * R3 で決済を導入する際に paid / shipped 等を追加する想定
 * （DB 側の CHECK 制約も合わせて migration で貼り直す。orders テーブルの migration 参照）。
 */
enum OrderStatus: string
{
    case Pending = 'pending';
    case Cancelled = 'cancelled';
}

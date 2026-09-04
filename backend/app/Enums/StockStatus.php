<?php

namespace App\Enums;

/**
 * 在庫ステータス。docs/02-database-design.md の在庫ステータス表に対応。
 *
 * 「在庫数 → ステータス」の判定ロジックをここ1か所に集約する。
 * 公開 API（商品一覧・詳細）と管理ダッシュボードから共通で使う。
 *
 * 表示ラベル（"残りわずか" 等）はフロント側の担当。API は value（意味的な値）だけ返す。
 */
enum StockStatus: string
{
    case SoldOut = 'sold_out';
    case Low = 'low_stock';
    case InStock = 'in_stock';

    /**
     * 在庫数からステータスを求める。閾値は config/shop.php（docs/06 §7）。
     * 一覧では「全 variant の在庫合算」、詳細では「その variant の在庫」を渡す。
     */
    public static function fromStock(int $stock): self
    {
        return match (true) {
            $stock <= 0 => self::SoldOut,
            $stock <= config('shop.low_stock_threshold') => self::Low,
            default => self::InStock,
        };
    }
}

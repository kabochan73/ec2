<?php

namespace App\Actions\Order;

use App\Domain\Order\OrderNumberGenerator;
use App\Domain\Order\ShippingFeeCalculator;
use App\Enums\OrderStatus;
use App\Exceptions\InsufficientStockException;
use App\Exceptions\UnpublishedProductException;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * 注文作成トランザクション（docs/02 の「注文作成トランザクション」手順そのもの）。
 */
final class CreateOrder
{
    public function __construct(
        private readonly ShippingFeeCalculator $shippingFee,
        private readonly OrderNumberGenerator $orderNumber,
    ) {}

    public function execute(User $user, CreateOrderInput $input): Order
    {
        return DB::transaction(function () use ($user, $input) {
            // 1. 対象 variant を FOR UPDATE でロック。商品情報・主画像も一緒に読む
            //    （画像はスナップショット用。position 順の先頭1件だけで十分なので絞って取得）
            $variants = ProductVariant::with(['product.images' => fn ($q) => $q->orderBy('position')->limit(1)])
                ->whereIn('id', $input->variantIds())
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            // 2. 在庫充足を検証。不足があれば 422 で該当明細を返してロールバック
            $shortages = [];
            foreach ($input->items as $line) {
                $variant = $variants->get($line->variantId);
                if ($variant->stock < $line->quantity) {
                    $shortages[] = ['variant_id' => $variant->id, 'available' => $variant->stock];
                }
            }
            if ($shortages !== []) {
                throw new InsufficientStockException($shortages);
            }

            // 3. 未公開商品が含まれていないか検証
            $unpublishedProductIds = $variants
                ->filter(fn (ProductVariant $v) => ! $v->product->is_published)
                ->pluck('product_id')
                ->unique()
                ->values()
                ->all();
            if ($unpublishedProductIds !== []) {
                throw new UnpublishedProductException($unpublishedProductIds);
            }

            // 4. 明細を組み立てつつ subtotal を再計算（クライアント送信の金額は信用しない）
            $subtotal = 0;
            $itemAttributes = [];
            foreach ($input->items as $line) {
                $variant = $variants->get($line->variantId);
                $product = $variant->product;
                $lineTotal = $product->price * $line->quantity;
                $subtotal += $lineTotal;

                $primaryImage = $product->images->first();

                $itemAttributes[] = [
                    'product_id' => $product->id,
                    'product_variant_id' => $variant->id,
                    'product_name' => $product->name,
                    'variant_size' => $variant->size,
                    'variant_color' => $variant->color,
                    // 画像が1枚も無い商品は空文字（image_url は NOT NULL 列のため）。
                    // 運用上、admin 側で公開前に画像を付ける想定
                    'image_url' => $primaryImage ? '/media/'.$primaryImage->path : '',
                    'unit_price' => $product->price,
                    'quantity' => $line->quantity,
                    'line_total' => $lineTotal,
                ];
            }

            $shippingFee = $this->shippingFee->for($subtotal);

            // 5-6. 配送先の決定 + 注文番号採番 + orders/order_items 作成
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => $this->orderNumber->generate(),
                'status' => OrderStatus::Pending,
                'subtotal' => $subtotal,
                'shipping_fee' => $shippingFee,
                'total' => $subtotal + $shippingFee,
                ...$this->resolveShippingAddress($user, $input),
            ]);
            $order->items()->createMany($itemAttributes);

            // 7. 在庫を減算（SQL 側で stock = stock - X するので、ロック中の在庫と実際の更新がズレない）
            foreach ($input->items as $line) {
                $variants->get($line->variantId)->decrement('stock', $line->quantity);
            }

            // 8. 新規住所かつ「保存」指定なら addresses にも作成
            if ($input->newAddress && $input->saveAddress) {
                $user->addresses()->create($input->newAddress->toAddressAttributes());
            }

            // 9. コミット（DB::transaction のクロージャが正常終了すると自動コミット）
            return $order->load('items');
        });
    }

    /**
     * @return array<string, mixed> orders テーブルの ship_* 列
     */
    private function resolveShippingAddress(User $user, CreateOrderInput $input): array
    {
        if ($input->addressId !== null) {
            // StoreOrderRequest 側で「本人の住所であること」は Rule::exists(...)->where(...) で検証済み
            $address = $user->addresses()->findOrFail($input->addressId);

            return [
                'ship_recipient_name' => $address->recipient_name,
                'ship_postal_code' => $address->postal_code,
                'ship_prefecture' => $address->prefecture,
                'ship_city' => $address->city,
                'ship_address_line1' => $address->address_line1,
                'ship_address_line2' => $address->address_line2,
                'ship_phone' => $address->phone,
            ];
        }

        return $input->newAddress->toOrderShipAttributes();
    }
}

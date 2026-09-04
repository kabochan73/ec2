<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // product_name / variant_size 等はスナップショットなので、product_id と product_variant_id が
        // 指すレコードと矛盾しないよう、ここで実際に product と variant を作ってから値をコピーする
        // （別々の Factory を割り当てると参照先とスナップショットの中身がズレる）。
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->for($product)->create();
        $quantity = fake()->numberBetween(1, 3);

        return [
            'order_id' => Order::factory(),
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'product_name' => $product->name,
            'variant_size' => $variant->size,
            'variant_color' => $variant->color,
            'image_url' => '/media/products/'.$product->id.'/'.Str::uuid().'.jpg',
            'unit_price' => $product->price,
            'quantity' => $quantity,
            'line_total' => $product->price * $quantity,
        ];
    }
}

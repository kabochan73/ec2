<?php

namespace App\Actions\Order;

use App\Http\Requests\Order\StoreOrderRequest;

/**
 * CreateOrder Action への入力。StoreOrderRequest から組み立てる。
 */
final readonly class CreateOrderInput
{
    /**
     * @param  list<CartLineInput>  $items
     */
    public function __construct(
        public array $items,
        public ?int $addressId,
        public ?ShippingAddressInput $newAddress,
        public bool $saveAddress,
    ) {}

    public static function fromRequest(StoreOrderRequest $request): self
    {
        $validated = $request->validated();

        $items = array_map(
            fn (array $item) => new CartLineInput(
                variantId: (int) $item['variant_id'],
                quantity: (int) $item['quantity'],
            ),
            $validated['items']
        );

        return new self(
            items: $items,
            addressId: isset($validated['address_id']) ? (int) $validated['address_id'] : null,
            newAddress: isset($validated['address']) ? ShippingAddressInput::fromArray($validated['address']) : null,
            saveAddress: (bool) ($validated['save_address'] ?? false),
        );
    }

    /**
     * @return list<int>
     */
    public function variantIds(): array
    {
        return array_map(fn (CartLineInput $line) => $line->variantId, $this->items);
    }
}

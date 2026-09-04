<?php

namespace App\Actions\Order;

/**
 * 注文で新規入力された配送先。addresses テーブル・orders テーブルの ship_* 列、
 * どちらの形にも変換できるようにしている（保存先が2箇所あるため）。
 */
final readonly class ShippingAddressInput
{
    public function __construct(
        public string $recipientName,
        public string $postalCode,
        public string $prefecture,
        public string $city,
        public string $addressLine1,
        public ?string $addressLine2,
        public string $phone,
    ) {}

    /**
     * @param  array<string, mixed>  $data  StoreOrderRequest::validated()['address'] をそのまま渡す想定
     */
    public static function fromArray(array $data): self
    {
        return new self(
            recipientName: $data['recipient_name'],
            postalCode: $data['postal_code'],
            prefecture: $data['prefecture'],
            city: $data['city'],
            addressLine1: $data['address_line1'],
            addressLine2: $data['address_line2'] ?? null,
            phone: $data['phone'],
        );
    }

    /**
     * addresses テーブルへの保存用（save_address=true のとき）。
     *
     * @return array<string, mixed>
     */
    public function toAddressAttributes(): array
    {
        return [
            'recipient_name' => $this->recipientName,
            'postal_code' => $this->postalCode,
            'prefecture' => $this->prefecture,
            'city' => $this->city,
            'address_line1' => $this->addressLine1,
            'address_line2' => $this->addressLine2,
            'phone' => $this->phone,
        ];
    }

    /**
     * orders テーブルの ship_* 列への保存用（配送先スナップショット）。
     *
     * @return array<string, mixed>
     */
    public function toOrderShipAttributes(): array
    {
        return [
            'ship_recipient_name' => $this->recipientName,
            'ship_postal_code' => $this->postalCode,
            'ship_prefecture' => $this->prefecture,
            'ship_city' => $this->city,
            'ship_address_line1' => $this->addressLine1,
            'ship_address_line2' => $this->addressLine2,
            'ship_phone' => $this->phone,
        ];
    }
}

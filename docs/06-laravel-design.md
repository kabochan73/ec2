# Laravel 設計指針（R2）

「綺麗な Laravel」= 設計論を発明することではなく、**フレームワークが用意したレイヤーを正しく使い分け、ビジネスロジックを1箇所に集める**こと。DDD・ヘキサゴナル・CQRS は持ち込まない（この規模では負債になる）。

---

## 0. 2大アンチパターン（これを避けるための指針）

| アンチパターン | 症状 | 対策 |
|---|---|---|
| Fat Controller | コントローラに在庫チェック・金額計算・トランザクションが書いてある | ロジックを Action に出す。コントローラは 5〜10 行 |
| 過剰な抽象化 | 差し替え予定のない Interface、全テーブルに Repository、神 Service | 「差し替える予定がある」「同じロジックが3箇所に出た」ときだけ抽象化する。予測で作らない |

---

## 1. レイヤー構成

| レイヤー | 置き場所 | 責務 | 目安の行数 |
|---|---|---|---|
| Route | `routes/api.php` | URL とコントローラの対応、ミドルウェア | — |
| Controller | `app/Http/Controllers/Api` | 入力を受け取り Action を呼び、Resource を返すだけ | 5〜10 |
| FormRequest | `app/Http/Requests` | 形式的バリデーション + 認可 | — |
| Action | `app/Actions` | ビジネスロジック1ユースケース。トランザクション境界 | 20〜80 |
| Domain クラス | `app/Domain`（または `app/Support`） | Eloquent 非依存の純粋ロジック（送料計算・採番など） | 小 |
| Model | `app/Models` | リレーション・スコープ・キャスト。クエリの語彙 | — |
| Enum | `app/Enums` | 状態・区分の定義とそれに紐づく振る舞い | — |
| API Resource | `app/Http/Resources` | レスポンス JSON の整形 | — |
| Exception | `app/Exceptions` | ドメインエラー → HTTP 変換（`render()`） | 小 |

データの流れ:

```
Request
  → Route
  → Controller
      → FormRequest（バリデーション・認可）
      → Action::execute(DTO)
          → Domain クラス（純粋ロジック）
          → Model（クエリ・永続化）
          → throw DomainException（異常系）
  → API Resource（整形）
  → JSON Response
```

---

## 2. Action と Service の使い分け

どちらも Laravel 公式概念ではなくコミュニティの慣習。違いは **粒度** と **育ち方**。

| | Service | Action |
|---|---|---|
| 単位 | ドメイン領域ごとのクラス（複数メソッド） | ユースケース1つごとのクラス（公開メソッド1つ） |
| 命名 | 名詞 `OrderService` | 動詞 `CreateOrder` |
| 公開 API | `create()` `cancel()` `ship()` ... | `execute()` だけ |
| コンストラクタ | 全メソッド分の依存が集まる（全部入り） | その操作に必要な依存だけ = 正確なドキュメント |
| 育ち方 | 放置すると神クラス化する引力がある | 増えるのは「数」であって「複雑さ」ではない。1個のサイズが一定 |

### ルール

- **デフォルトは Action**。ビジネスの手続き（書き込み・状態変更）は 1 ユースケース 1 クラス。
- **Service を使うのは、外部システムの凝集したラッパーのみ**。メソッド群が同じ依存を共有し、無限には増えないもの。
  - このプロジェクトでは `StorageService`（S3互換バケット操作）1個で足りるはず。
- **単純な読み取りに Action を作らない**。コントローラ直書き、または複雑な検索条件が育ったら `Query` クラス（例 `ProductSearchQuery`）。
- **Action が Action を呼ぶのは 1 段まで**。共通ロジックが2つの Action に現れたら、Action 同士を呼び合わず Domain クラスに抽出して両方がコンストラクタで受け取る。
- **メソッド名は統一**。`execute()` で統一する（`handle` / `__invoke` と混在させない）。

### R2 で想定される Action（8〜12 個程度）

`CreateOrder` / `CancelOrder` / `RegisterUser` / `StoreAddress` / `UpdateAddress` / `DeleteAddress` / `SetDefaultAddress` / `UpdateProfile` / `CreateProduct`(admin) / `UpdateProduct`(admin) / `ToggleProductPublished`(admin)

---

## 3. 各レイヤーの書き方（`POST /api/orders` を例に）

設計の元ネタは `docs/02-database-design.md` の「注文作成トランザクション」。

### Route

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/orders', [OrderController::class, 'store']);
});
```

### Controller — 受け取る → 渡す → 返す だけ

```php
class OrderController extends Controller
{
    public function store(StoreOrderRequest $request, CreateOrder $createOrder): JsonResponse
    {
        $order = $createOrder->execute(
            user: $request->user(),
            input: CreateOrderInput::fromRequest($request),
        );

        return OrderResource::make($order)->response()->setStatusCode(201);
    }
}
```

`if` も `DB::transaction` も書かない。

### FormRequest — 形式的バリデーションだけ

```php
class StoreOrderRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:10'],
            'address_id' => ['nullable', 'integer',
                Rule::exists('addresses', 'id')->where('user_id', $this->user()->id)],
            'address' => ['required_without:address_id', 'array'],
            'address.postal_code' => ['required_with:address', 'regex:/^\d{3}-\d{4}$/'],
            // ...
            'save_address' => ['boolean'],
        ];
    }
}
```

**「DB を叩かないと分からない検証」はここに書かない。** 在庫は Action 内で `lockForUpdate()` してから見る（競合対策上そこでしか正しく検証できない）。

### DTO — 複雑な入力だけ型で固める

```php
final readonly class CreateOrderInput
{
    /** @param  list<CartLineInput>  $items */
    public function __construct(
        public array $items,
        public ?int $addressId,
        public ?ShippingAddressInput $newAddress,
        public bool $saveAddress,
    ) {}

    public static function fromRequest(StoreOrderRequest $r): self { /* ... */ }
}
```

一覧の `?category=tops` のような単純な入力に DTO は要らない。

### Action — ロジック本体、トランザクション境界

```php
final class CreateOrder
{
    public function __construct(
        private readonly ShippingFeeCalculator $shippingFee,
        private readonly OrderNumberGenerator $orderNumber,
    ) {}

    public function execute(User $user, CreateOrderInput $input): Order
    {
        return DB::transaction(function () use ($user, $input) {
            // 1. variant を FOR UPDATE でロック
            $variants = ProductVariant::with('product')
                ->whereIn('id', $input->variantIds())
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            // 2. 在庫・公開状態を検証（不足なら例外でロールバック）
            $lines = $this->buildLines($input->items, $variants);

            // 3. 金額をサーバ側で再計算（クライアント送信の金額は信用しない）
            $subtotal = $lines->sum->lineTotal();
            $shipping = $this->shippingFee->for($subtotal);

            // 4. 注文作成 + 在庫減算
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => $this->orderNumber->generate(),
                'status' => OrderStatus::Pending,
                'subtotal' => $subtotal,
                'shipping_fee' => $shipping,
                'total' => $subtotal + $shipping,
                ...$this->resolveShippingAddress($user, $input), // ship_* スナップショット
            ]);
            $order->items()->createMany($lines->map->toAttributes()->all());
            $this->decrementStock($variants, $lines);

            // 5. 新規住所かつ保存指定なら addresses にも作成
            if ($input->newAddress && $input->saveAddress) {
                $user->addresses()->create($input->newAddress->toArray());
            }

            return $order->load('items');
        });
    }
}
```

- 1 Action = 1 ユースケース。動詞で命名。
- トランザクションは Action が持つ（コントローラでもモデルでもない）。
- 再利用される純粋ロジック（送料計算・採番）は Domain クラスに切り出しコンストラクタ注入。
- 金額計算は絶対にクライアントを信じない。

### Domain クラス — 純粋ロジック

```php
final class ShippingFeeCalculator
{
    public function for(int $subtotal): int
    {
        return $subtotal >= config('shop.free_shipping_threshold')
            ? 0
            : config('shop.shipping_fee');
    }
}
```

### Exception — ドメインエラー → HTTP 変換

```php
final class InsufficientStockException extends Exception
{
    /** @param  list<array{variant_id:int, requested:int, available:int}>  $shortages */
    public function __construct(public readonly array $shortages)
    {
        parent::__construct('Insufficient stock.');
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => '在庫が不足している商品があります。',
            'shortages' => $this->shortages,
        ], 422);
    }
}
```

Action は `throw new InsufficientStockException(...)` するだけ。HTTP を知らなくていい。

---

## 4. Eloquent / Model

### スコープでクエリに言葉を与える

```php
// app/Models/Product.php
public function scopePublished(Builder $q): void
{
    $q->where('is_published', true);
}

public function scopeInCategory(Builder $q, string $slug): void
{
    $q->whereRelation('category', 'slug', $slug);
}
```

```php
Product::published()->inCategory('tops')->orderBy('position')->paginate(24);
```

### N+1 対策

- グローバル eager load（`protected $with = [...]`）は原則しない。罠になる。
- 必要な箇所で `->with([...])` を明示。
- `AppServiceProvider::boot()` で開発時のみ `Model::preventLazyLoading(! app()->isProduction())` → N+1 が即例外でバレる。

### キャスト・Enum

```php
protected function casts(): array
{
    return [
        'is_published' => 'boolean',
        'size_chart' => 'array',
        'status' => OrderStatus::class,
        'price' => 'integer',
    ];
}
```

---

## 5. Enum に振る舞いを持たせる

判定ロジックを1箇所に集める。API Resource も管理画面も同じ Enum を使う。

```php
enum StockStatus: string
{
    case SoldOut = 'sold_out';
    case Low = 'low';
    case InStock = 'in_stock';

    public static function fromStock(int $stock): self
    {
        return match (true) {
            $stock === 0 => self::SoldOut,
            $stock <= config('shop.low_stock_threshold') => self::Low,
            default => self::InStock,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::SoldOut => 'SOLD OUT',
            self::Low => '残りわずか',
            self::InStock => '在庫あり',
        };
    }

    public function selectable(): bool
    {
        return $this !== self::SoldOut;
    }
}
```

R2 で作る Enum: `OrderStatus`（`pending` / `cancelled`）、`StockStatus`、`UserRole`（`customer` / `admin`）。

`StockStatus` は上記サンプルより絞り、`fromStock()`（判定ロジック）だけ持たせる。`label()` / `selectable()` の UI 文字列はフロント側の担当（API は value のみ返す）。`ProductSize` は `product_variants.size` を文字列のまま扱えば足りるので作らない（「予測で作らない」§0。必要になったら追加）。

---

## 6. API Resource

レスポンス整形はここだけ。ビジネスロジックは入れない。

```php
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'price' => $this->price,
            'category' => CategoryResource::make($this->whenLoaded('category')),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'variants' => VariantResource::collection($this->whenLoaded('variants')),
        ];
    }
}
```

```php
// ProductImageResource — url 組み立てはここ
'url' => '/media/' . $this->path,
```

```php
// VariantResource — 在庫ステータスは Enum に委譲
$status = StockStatus::fromStock($this->stock);
return [
    'id' => $this->id,
    'size' => $this->size,
    'color' => $this->color,
    'stock_status' => $status->value,
    'stock_label' => $status->label(),
    'selectable' => $status->selectable(),
    // 生の stock 値は公開 API では返さない
];
```

`whenLoaded()` を徹底 → ロードされていなければキーごと出さない。過剰レスポンスと N+1 の両方を防ぐ。

---

## 7. マジックナンバーは config に集約

```php
// config/shop.php
return [
    'shipping_fee' => 800,
    'free_shipping_threshold' => 20_000,
    'low_stock_threshold' => 3,          // docs/02 の LOW_STOCK_THRESHOLD
    'order_number_prefix' => 'EC',
    'product_code_prefix' => 'EC',
    'cart_max_quantity_per_line' => 10,
];
```

コード内に `800` や `20000` を直接書かない。

---

## 8. 公開 API と管理 API の分離

同じ `Product` でも公開用と管理用で扱いが違う（公開は `is_published = true` のみ・在庫数を隠す、管理は全件・在庫数を見せる）。

- ルート: `routes/api.php` 内で `Route::prefix('admin')->middleware(['auth:sanctum', 'can:access-admin'])`
- コントローラ: `app/Http/Controllers/Api/Admin/` に分ける
- Resource: `ProductResource`（公開）と `Admin/ProductResource`（管理）を分ける。無理に共通化しない
- 認可: `UserRole::Admin` を見る Gate（`Gate::define('access-admin', fn (User $u) => $u->role === UserRole::Admin)`）

---

## 9. ディレクトリ構成

```
app/
├── Actions/
│   ├── Order/
│   │   ├── CreateOrder.php
│   │   ├── CreateOrderInput.php
│   │   └── CancelOrder.php
│   ├── Address/
│   ├── Auth/
│   └── Admin/
├── Domain/                     # Eloquent 非依存の純粋ロジック
│   └── Order/
│       ├── ShippingFeeCalculator.php
│       └── OrderNumberGenerator.php
├── Enums/
│   ├── OrderStatus.php
│   ├── StockStatus.php
│   └── UserRole.php
├── Http/
│   ├── Controllers/Api/
│   │   └── Admin/
│   ├── Requests/
│   └── Resources/
│       └── Admin/
├── Exceptions/
├── Models/
└── Services/
    └── StorageService.php      # S3互換バケット。Service を使う数少ない場所
```

`Domain/` を分けるのは好みの範囲。最初は `Actions/` 配下に純粋ロジックも置き、育ってきたら切り出すのでも良い。

---

## 10. 命名規約

| 対象 | 規約 | 例 |
|---|---|---|
| Action | 動詞 + 名詞、`execute()` メソッド | `CreateOrder` `ToggleProductPublished` |
| Action の入力 DTO | `{Action名}Input` | `CreateOrderInput` |
| FormRequest | `{動詞}{モデル}Request` | `StoreOrderRequest` `UpdateProfileRequest` |
| Resource | `{モデル}Resource` | `OrderResource` |
| Enum | 単数名詞 | `OrderStatus` |
| Model スコープ | 形容詞 / 状態 | `scopePublished` `scopeForUser` |
| Domain クラス | 役割を表す名詞 | `ShippingFeeCalculator` |
| config キー | snake_case、ドメインごとにファイル | `config('shop.shipping_fee')` |

---

## 11. バリデーションの層分担

| 層 | 何を検証するか | 例 |
|---|---|---|
| FormRequest | 形式・型・必須・所有権（DB 単発 exists まで） | `quantity` は 1〜10 の整数、`address_id` は本人のもの |
| Action | 業務ルール・競合が絡む検証 | `lockForUpdate` 後の在庫充足、`is_published` チェック、金額再計算 |
| DB 制約 | 最終防衛線 | `stock >= 0` CHECK、`sku` UNIQUE、FK |

同じ検証を複数層で重複させてよい（DB 制約は常に張る）。役割が違う。

### FormRequest を分ける基準

- **書き込み系（POST / PUT / PATCH / DELETE で body を取る）は rules が1行でも FormRequest に分ける。** 一貫性（全コントローラが同じ形になる）と `authorize()` の置き場所を確保するため。所有権チェック（`address` が本人のものか等）は `authorize()` に書き、失敗時は自動で 403。
- **読み取り系（GET のクエリパラメータ）はインライン `$request->validate([...])` でよい。** フィルタ条件が育ってきたら `ProductSearchQuery` などの Query クラスに切り出す（§13 参照）。
- rules が空の FormRequest を儀式で作らない。検証対象がなければ作らない。

---

## 12. テスト戦略

- **Feature テスト中心**（HTTP を叩いて JSON を検証）。費用対効果が最も高い。
- **Unit テストは純粋ロジックだけ**（`ShippingFeeCalculator`、`StockStatus::fromStock`、`OrderNumberGenerator`）。
- Factory を全モデルに用意。シーダーは Factory を呼ぶ。
- Repository パターンは使わない → テストは実 DB（Postgres / sqlite）で回す。

```php
it('rejects order when stock is insufficient', function () {
    $variant = ProductVariant::factory()->create(['stock' => 1]);
    $user = User::factory()->create();
    $address = Address::factory()->for($user)->create();

    $this->actingAs($user)
        ->postJson('/api/orders', [
            'items' => [['variant_id' => $variant->id, 'quantity' => 5]],
            'address_id' => $address->id,
        ])
        ->assertStatus(422)
        ->assertJsonPath('shortages.0.available', 1);

    expect($variant->fresh()->stock)->toBe(1); // ロールバックされている
});
```

---

## 13. やらないことリスト（過剰設計の抑止）

| 誘惑 | R2 の判断 | 理由 |
|---|---|---|
| Repository パターン | 使わない | Eloquent がすでに Repository。二重になる |
| 何でも入れる `OrderService` | Action に分割 | 神クラス化する |
| Interface + 実装1つ | 作らない | 差し替え予定がなければ純粋な負債 |
| 全リクエストに DTO | 複雑なものだけ | 単純な GET パラメータに DTO は不要 |
| CQRS / イベントソーシング | 論外 | ポートフォリオ EC |
| キュー / Redis | R2 では入れない | 非同期処理・キャッシュ層が必要な負荷がない（`docs/00` 参照） |

**判断基準**: 「差し替える予定がある」か「同じロジックが3箇所に出た」ときだけ抽象化する。

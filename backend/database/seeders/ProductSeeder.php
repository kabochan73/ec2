<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * 開発・レビュー用のカタログ。
 *
 * - 画像（product_images）は作らない。フロントは画像ゼロなら "NO IMAGE"（グレー背景）を表示する
 * - slug をキーに updateOrCreate、variant は sku キー。`db:seed` は冪等
 * - 在庫は SOLD OUT / LOW STOCK / 在庫あり が混ざるように調整（表示確認用）
 * - 1点だけ is_published=false（published スコープの動作確認用）
 *
 * CategorySeeder が先に走っている前提（DatabaseSeeder の呼び出し順）。
 */
class ProductSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Tops / Outerwear 共通のサイズ表（cm）。
     *
     * @var array<string, mixed>
     */
    private const TOPS_CHART = [
        'unit' => 'cm',
        'columns' => ['着丈', '身幅', '肩幅', '袖丈'],
        'rows' => [
            'S' => [66, 52, 46, 20],
            'M' => [69, 55, 48, 21],
            'L' => [72, 58, 50, 22],
        ],
    ];

    /**
     * @var array<string, mixed>
     */
    private const OUTER_CHART = [
        'unit' => 'cm',
        'columns' => ['着丈', '身幅', '肩幅', '袖丈'],
        'rows' => [
            'S' => [70, 56, 50, 60],
            'M' => [73, 59, 52, 62],
            'L' => [76, 62, 54, 64],
        ],
    ];

    /**
     * Bottoms のサイズ表（cm）。測定項目が Tops と違う。
     *
     * @var array<string, mixed>
     */
    private const BOTTOMS_CHART = [
        'unit' => 'cm',
        'columns' => ['ウエスト', '股上', '股下', 'わたり幅', '裾幅'],
        'rows' => [
            'S' => [70, 26, 68, 30, 20],
            'M' => [74, 27, 70, 32, 21],
            'L' => [78, 28, 72, 34, 22],
        ],
    ];

    public function run(): void
    {
        // slug => Category を引けるようにしておく
        $categories = Category::pluck('id', 'slug');

        foreach ($this->catalog() as $data) {
            $variants = $data['variants'];
            // 'category'（slug）と 'variants' は products 列ではないので取り除く
            $categorySlug = $data['category'];
            unset($data['variants'], $data['category']);

            $product = Product::updateOrCreate(
                ['slug' => $data['slug']],
                [...$data, 'category_id' => $categories[$categorySlug]],
            );

            foreach ($variants as $position => $variant) {
                $product->variants()->updateOrCreate(
                    ['sku' => $product->product_code.'-'.$variant['size']],
                    [
                        'size' => $variant['size'],
                        'color' => null,
                        'stock' => $variant['stock'],
                        'position' => $position,
                    ],
                );
            }
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function catalog(): array
    {
        // アパレルは S/M/L、アクセサリーは FREE 単一。
        $sml = fn (int $s, int $m, int $l): array => [
            ['size' => 'S', 'stock' => $s],
            ['size' => 'M', 'stock' => $m],
            ['size' => 'L', 'stock' => $l],
        ];
        $free = fn (int $stock): array => [['size' => 'FREE', 'stock' => $stock]];

        return [
            // ── TOPS ────────────────────────────────────────────
            [
                'category' => 'tops',
                'name' => 'Boxy Cotton T-Shirt',
                'slug' => 'boxy-cotton-t-shirt',
                'price' => 9000,
                'description' => "肉厚の天竺で組んだ箱型のTシャツ。身幅を広く、着丈を短めに設定し、一枚でもレイヤードでも構造が崩れない。\n洗いをかけて微起毛させ、乾いた表面感に仕上げている。",
                'material' => '本体 綿100%',
                'care' => '液温30℃以下・弱い手洗い / 漂白不可 / 日陰吊り干し / アイロン中温',
                'origin' => '日本',
                'product_code' => 'EC-TP0001',
                'size_chart' => self::TOPS_CHART,
                'is_published' => true,
                'position' => 1,
                'variants' => $sml(8, 12, 4),
            ],
            [
                'category' => 'tops',
                'name' => 'Heavyweight Long Sleeve Tee',
                'slug' => 'heavyweight-long-sleeve-tee',
                'price' => 13000,
                'description' => "20/2の糸を高密度で編み立てたロングスリーブ。袖はやや長く、リブは浅め。\n首元のバインダーを二重にして、着込んでも伸びにくい。",
                'material' => '本体 綿100%',
                'care' => '液温30℃以下・弱い手洗い / 漂白不可 / 日陰吊り干し / アイロン中温',
                'origin' => '日本',
                'product_code' => 'EC-TP0002',
                'size_chart' => self::TOPS_CHART,
                'is_published' => true,
                'position' => 2,
                'variants' => $sml(3, 6, 0), // S=残りわずか / L=売り切れ
            ],
            [
                'category' => 'tops',
                'name' => 'Oversized Sweatshirt',
                'slug' => 'oversized-sweatshirt',
                'price' => 18000,
                'description' => "裏毛のオーバーサイズスウェット。肩を大きく落とし、リブで裾を絞らずカットオフに近い始末にしている。\n度詰めの生地で、洗うほど body に沿う。",
                'material' => '本体 綿90% / ポリエステル10%',
                'care' => '液温40℃以下・洗濯機弱水流 / 漂白不可 / 日陰平干し / アイロン中温',
                'origin' => '中国',
                'product_code' => 'EC-TP0003',
                'size_chart' => self::TOPS_CHART,
                'is_published' => true,
                'position' => 3,
                'variants' => $sml(10, 10, 7),
            ],
            [
                'category' => 'tops',
                'name' => 'Ribbed Knit Polo',
                'slug' => 'ribbed-knit-polo',
                'price' => 16000,
                'description' => '5ゲージのリブで編んだニットポロ。開き幅を狭くし、比翼で釦を隠している。（下書き・未公開）',
                'material' => '本体 綿70% / ナイロン30%',
                'care' => 'ドライクリーニング',
                'origin' => '日本',
                'product_code' => 'EC-TP0004',
                'size_chart' => self::TOPS_CHART,
                'is_published' => false, // published スコープの動作確認用
                'position' => 4,
                'variants' => $sml(5, 5, 5),
            ],

            // ── BOTTOMS ─────────────────────────────────────────
            [
                'category' => 'bottoms',
                'name' => 'Relaxed Tapered Trousers',
                'slug' => 'relaxed-tapered-trousers',
                'price' => 22000,
                'description' => "ワンタックのリラックストラウザー。腰まわりにゆとりを持たせ、膝下から緩くテーパード。\nセンタープレスを効かせられる中肉のギャバジン。",
                'material' => '本体 ポリエステル65% / 毛35%',
                'care' => 'ドライクリーニング',
                'origin' => '日本',
                'product_code' => 'EC-BT0001',
                'size_chart' => self::BOTTOMS_CHART,
                'is_published' => true,
                'position' => 1,
                'variants' => $sml(2, 9, 11), // S=残りわずか
            ],
            [
                'category' => 'bottoms',
                'name' => 'Wide Denim Pants',
                'slug' => 'wide-denim-pants',
                'price' => 24000,
                'description' => "13ozのセルビッジデニムを使ったワイドストレート。ノンウォッシュのリジッドで、股上は深め。\n穿き込みで色が抜けるように、インディゴを濃くロープ染色している。",
                'material' => '本体 綿100%',
                'care' => '単独で洗濯 / 裏返して陰干し / 漂白不可',
                'origin' => '日本',
                'product_code' => 'EC-BT0002',
                'size_chart' => self::BOTTOMS_CHART,
                'is_published' => true,
                'position' => 2,
                'variants' => $sml(6, 0, 4), // M=売り切れ
            ],
            [
                'category' => 'bottoms',
                'name' => 'Pleated Wool Skirt',
                'slug' => 'pleated-wool-skirt',
                'price' => 21000,
                'description' => "細かいプリーツを畳んだミモレ丈のスカート。ウエストはゴム不使用、比翼ファスナーで面を整えている。\n目付のあるトロピカルウールで、プリーツが落ちにくい。",
                'material' => '本体 毛100%',
                'care' => 'ドライクリーニング',
                'origin' => '日本',
                'product_code' => 'EC-BT0003',
                'size_chart' => self::BOTTOMS_CHART,
                'is_published' => true,
                'position' => 3,
                'variants' => $sml(7, 8, 6),
            ],
            [
                'category' => 'bottoms',
                'name' => 'Cotton Track Pants',
                'slug' => 'cotton-track-pants',
                'price' => 15000,
                'description' => "裏毛のトラックパンツ。サイドラインは配色テープではなく、生地を挟み込んだパイピングで表現。\n裾はリブで軽く絞り、少し溜まる丈に設定している。",
                'material' => '本体 綿88% / ポリエステル12%',
                'care' => '液温40℃以下・洗濯機弱水流 / 日陰吊り干し',
                'origin' => '中国',
                'product_code' => 'EC-BT0004',
                'size_chart' => self::BOTTOMS_CHART,
                'is_published' => true,
                'position' => 4,
                'variants' => $sml(14, 15, 12),
            ],

            // ── OUTERWEAR ───────────────────────────────────────
            [
                'category' => 'outerwear',
                'name' => 'Cropped Nylon Jacket',
                'slug' => 'cropped-nylon-jacket',
                'price' => 34000,
                'description' => "高密度ナイロンタフタのショート丈ジャケット。前立ては比翼、袖口はドットボタンで絞る。\n軽量だが張りがあり、身頃が体から浮く。",
                'material' => '本体 ナイロン100% / 裏地 ポリエステル100%',
                'care' => '液温30℃以下・手洗い / アイロン低温',
                'origin' => 'ベトナム',
                'product_code' => 'EC-OW0001',
                'size_chart' => self::OUTER_CHART,
                'is_published' => true,
                'position' => 1,
                'variants' => $sml(4, 5, 3),
            ],
            [
                'category' => 'outerwear',
                'name' => 'Wool Blend Coat',
                'slug' => 'wool-blend-coat',
                'price' => 58000,
                'description' => "メルトンのステンカラーコート。ラグランスリーブで肩の線を作らず、Aラインに振っている。\n見返しを深く取り、前を開けても裏が返らない。",
                'material' => '本体 毛80% / ナイロン20% / 裏地 キュプラ100%',
                'care' => 'ドライクリーニング',
                'origin' => '日本',
                'product_code' => 'EC-OW0002',
                'size_chart' => self::OUTER_CHART,
                'is_published' => true,
                'position' => 2,
                'variants' => $sml(2, 3, 1), // 全サイズ残りわずか
            ],
            [
                'category' => 'outerwear',
                'name' => 'Quilted Liner Vest',
                'slug' => 'quilted-liner-vest',
                'price' => 28000,
                'description' => "中綿を薄く入れたキルティングのライナーベスト。単体でも、コートの内側にも入る厚み。\n襟なし・比翼で、レイヤードの表情を邪魔しない。",
                'material' => '本体 ナイロン100% / 中綿 ポリエステル100%',
                'care' => '液温30℃以下・手洗い',
                'origin' => 'ベトナム',
                'product_code' => 'EC-OW0003',
                'size_chart' => self::OUTER_CHART,
                'is_published' => true,
                'position' => 3,
                'variants' => $sml(9, 8, 10),
            ],

            // ── ACCESSORIES（サイズ FREE 単一、size_chart なし）──
            [
                'category' => 'accessories',
                'name' => 'Leather Card Holder',
                'slug' => 'leather-card-holder',
                'price' => 12000,
                'description' => "植物タンニンなめしのカードホルダー。カードを3枚とレシート数枚。\n漉きを薄くし、コバは磨かず切りっぱなしに近い処理にしている。",
                'material' => '牛革',
                'care' => '水濡れ注意 / 乾いた布で乾拭き',
                'origin' => '日本',
                'product_code' => 'EC-AC0001',
                'size_chart' => null,
                'is_published' => true,
                'position' => 1,
                'variants' => $free(3), // 残りわずか
            ],
            [
                'category' => 'accessories',
                'name' => 'Logo Cotton Cap',
                'slug' => 'logo-cotton-cap',
                'price' => 8000,
                'description' => "6枚はぎのローキャップ。ツバは短め・浅めのクラウンで、被り面を平らに見せる。\nフロントに同色の刺繍で小さくロゴを入れている。",
                'material' => '本体 綿100%',
                'care' => '液温30℃以下・手洗い / 型崩れ注意',
                'origin' => '中国',
                'product_code' => 'EC-AC0002',
                'size_chart' => null,
                'is_published' => true,
                'position' => 2,
                'variants' => $free(20),
            ],
            [
                'category' => 'accessories',
                'name' => 'Wool Knit Beanie',
                'slug' => 'wool-knit-beanie',
                'price' => 7000,
                'description' => "ラムウールのリブビーニー。折り返し分を長めに取り、深く被れる。\nチクつきを抑えるため、内側の額に当たる部分だけ綿のテープを回している。",
                'material' => '本体 毛100%',
                'care' => '液温30℃以下・手洗い / 平干し',
                'origin' => '日本',
                'product_code' => 'EC-AC0003',
                'size_chart' => null,
                'is_published' => true,
                'position' => 3,
                'variants' => $free(0), // 売り切れ
            ],
        ];
    }
}

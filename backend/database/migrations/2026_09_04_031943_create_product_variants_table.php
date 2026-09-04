<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// 商品バリアント（サイズ×色）。docs/02-database-design.md の product_variants を参照。
// 在庫（stock）はここが単位。注文時にこの行をロックして減算する。
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();

            // 商品削除時は variant も一緒に削除する（CASCADE）
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            // S/M/L（アパレル）または FREE（アクセサリー）
            $table->string('size', 10);
            // 色展開する商品のみ値を入れる。1色のみの商品は null
            $table->string('color', 30)->nullable();
            $table->string('sku', 40)->unique();
            $table->integer('stock');
            // サイズ表示順（S→M→L）
            $table->integer('position');

            $table->timestamps();

            // Postgres は FK 制約だけでは自動でインデックスを張らないため明示
            $table->index('product_id');
        });

        // stock >= 0 は Schema Builder に無いので生SQLでCHECK制約を追加
        DB::statement('ALTER TABLE product_variants ADD CONSTRAINT product_variants_stock_non_negative CHECK (stock >= 0)');

        // UNIQUE(product_id, size, color) をそのまま張ると、Postgres は NULL 同士を「別の値」として
        // 扱うため、色展開しない商品（color = null）で同じ product_id + size の重複行を防げない。
        // そこで、color が非NULLの組み合わせは通常のUNIQUE制約、
        // color が NULL の組み合わせは部分UNIQUEインデックスで別途担保する。
        DB::statement('ALTER TABLE product_variants ADD CONSTRAINT product_variants_product_size_color_unique UNIQUE (product_id, size, color)');
        DB::statement('CREATE UNIQUE INDEX product_variants_product_size_null_color_unique ON product_variants (product_id, size) WHERE color IS NULL');
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};

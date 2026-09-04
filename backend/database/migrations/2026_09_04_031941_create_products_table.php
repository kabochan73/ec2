<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// 商品本体。docs/02-database-design.md の products を参照。
// 商品情報のうちカテゴリ横断で形が変わる size_chart は jsonb で持つ。
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            // カテゴリ削除時に商品が残っていたら削除させない（RESTRICT）
            $table->foreignId('category_id')->constrained()->restrictOnDelete();

            $table->string('name', 120);
            $table->string('slug', 140)->unique();
            // JPY 税込。金額は必ず整数で持つ（小数を扱わない）
            $table->integer('price');
            $table->text('description');
            $table->text('material');
            // 洗濯表示などの取扱い注意。無い商品もあるので nullable
            $table->text('care')->nullable();
            $table->string('origin', 50);
            // 表示用の品番（例: EC-TP0012）。variant の sku とは別物
            $table->string('product_code', 30);
            // カテゴリごとに測定項目が違うため商品ごとに jsonb で保持。アクセサリーは null
            $table->jsonb('size_chart')->nullable();
            // false は一覧・詳細・API から除外する
            $table->boolean('is_published')->default(true);
            // 一覧の並び順
            $table->integer('position');

            $table->timestamps();

            // Postgres は FK 制約だけでは自動でインデックスを張らないため明示的に追加
            $table->index('category_id');
            // 一覧の絞り込み・並び替えで頻出する組み合わせ
            $table->index(['is_published', 'position']);
        });

        // price > 0 は Schema Builder に無いので生SQLでCHECK制約を追加
        DB::statement('ALTER TABLE products ADD CONSTRAINT products_price_positive CHECK (price > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// 注文明細。docs/02-database-design.md の order_items を参照。
// 商品情報はスナップショット列で持ち、product_id / product_variant_id は参照リンク用途のみ。
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();

            // 注文削除時は明細も一緒に削除する（CASCADE）
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();

            // 商品・variant が後で削除されても明細は残す（SET NULL）。
            // 表示に使う商品情報は下記のスナップショット列を使う
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained()->nullOnDelete();

            // ここから下はすべて注文時点のスナップショット
            // （商品名・サイズ等が後で変わっても注文履歴は不変にする）
            $table->string('product_name', 120);
            $table->string('variant_size', 10);
            $table->string('variant_color', 30)->nullable();
            $table->string('image_url', 255);
            $table->integer('unit_price');
            $table->integer('quantity');
            $table->integer('line_total');

            $table->timestamps();

            // Postgres は FK 制約だけでは自動でインデックスを張らないため明示
            $table->index('order_id');
        });

        // quantity > 0 は Schema Builder に無いので生SQLでCHECK制約を追加
        DB::statement('ALTER TABLE order_items ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// 注文。docs/02-database-design.md の orders を参照。
// 配送先は addresses を参照せず、注文時点の値を ship_* にコピーして持つ。
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            // 会員は注文履歴が残るので RESTRICT（退会フローは別途検討）
            $table->foreignId('user_id')->constrained()->restrictOnDelete();

            // EC-YYYYMMDD-NNNN（日付内連番）
            $table->string('order_number', 20)->unique();
            // R2 は pending / cancelled のみ。R3 で paid / shipped を追加予定
            $table->string('status', 20);

            $table->integer('subtotal');
            $table->integer('shipping_fee');
            $table->integer('total');

            // 配送先は注文時点の値をスナップショットとしてコピー保持する
            // （住所録を後で編集・削除しても注文履歴は不変にするため）
            $table->string('ship_recipient_name', 100);
            $table->string('ship_postal_code', 8);
            $table->string('ship_prefecture', 10);
            $table->string('ship_city', 100);
            $table->string('ship_address_line1', 255);
            $table->string('ship_address_line2', 255)->nullable();
            $table->string('ship_phone', 20);

            $table->timestamps();

            // order_number は unique() 済みなのでインデックスは重複させない
            $table->index('user_id');
        });

        // status は現状 pending / cancelled の2値。R3 で paid / shipped を足すときは
        // 制約を DROP CONSTRAINT → 再作成する migration を追加する
        DB::statement("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'cancelled'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};

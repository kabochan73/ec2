<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// 住所録。docs/02-database-design.md の addresses を参照。
// 注文時にこの内容を orders.ship_* へスナップショットコピーする（履歴を不変にするため）。
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();

            // ユーザー削除時は住所録も一緒に削除する（CASCADE）
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('recipient_name', 100);
            $table->string('postal_code', 8);
            $table->string('prefecture', 10);
            $table->string('city', 100);
            $table->string('address_line1', 255);
            // 建物名・部屋番号。無い場合もあるので nullable
            $table->string('address_line2', 255)->nullable();
            $table->string('phone', 20);
            // ユーザーごとに最大1件 true。他レコードを false に更新する処理はアプリ側（Action）で担保
            $table->boolean('is_default')->default(false);

            $table->timestamps();

            // Postgres は FK 制約だけでは自動でインデックスを張らないため明示
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};

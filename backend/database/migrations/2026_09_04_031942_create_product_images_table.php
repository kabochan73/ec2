<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// 商品画像。docs/02-database-design.md の product_images を参照。
// 画像の実体は S3 互換バケット（ローカルは MinIO）。この表はキー（path）だけ持つ。
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();

            // 商品削除時は画像も一緒に削除する（CASCADE）
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            // バケットのオブジェクトキー（例: products/12/01J....jpg）。
            // url は持たず、API リソースが /media/{path} を組み立てて返す
            $table->string('path', 255);
            // alt テキストは登録直後は未入力のこともあるため nullable
            $table->string('alt', 255)->nullable();
            // 0=主画像、1=一覧ホバー画像、以降ギャラリー順
            $table->integer('position');

            $table->timestamps();

            // Postgres は FK 制約だけでは自動でインデックスを張らないため明示
            $table->index(['product_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_images');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// 商品カテゴリ。Tops / Bottoms / Outerwear / Accessories の4つ（フラット、階層なし）。
// docs/02-database-design.md の categories を参照。
// 初期4件は Seeder ではなく管理画面（/admin のカテゴリ管理）から作成する方針
// （admin 機能を実際に使って動作確認する目的。docs/02 の決定事項）。
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            // 表示名（例: "Tops"）
            $table->string('name', 50);
            // URL用スラッグ（例: "tops"）。/collections/{slug} で参照する
            $table->string('slug', 50)->unique();
            // 一覧の表示順
            $table->integer('position');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};

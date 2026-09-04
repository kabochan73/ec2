<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// users に role 列を追加。docs/02-database-design.md の users を参照。
// 管理画面（/api/admin/*）の認可に使う。
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // customer / admin の2値、デフォルトは一般顧客。
            // password の直後に置く（docs/02 の列順に合わせる）
            $table->string('role', 20)->default('customer')->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};

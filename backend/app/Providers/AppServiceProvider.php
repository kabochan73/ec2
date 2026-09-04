<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 開発時のみ、リレーションの遅延ロード（lazy loading）を例外にする。
        // eager load 忘れ（N+1）をコード段階で気づけるようにする（docs/06 §4）。
        // 本番では従来どおり遅延ロードを許可（例外で落とさない）。
        Model::preventLazyLoading(! $this->app->isProduction());
    }
}

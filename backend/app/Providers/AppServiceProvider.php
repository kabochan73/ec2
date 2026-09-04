<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

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
        Model::preventLazyLoading(! $this->app->isProduction());

        // ログイン総当たり対策。メールアドレス＋IP の組み合わせで 5回/分に制限する。
        // （IP だけだと同じ回線の他ユーザーを巻き込む、メールだけだと特定アカウント狙いの
        //   ロックアウト DoS を許してしまうので、両方を混ぜる）
        // routes/api.php の login ルートに ->middleware('throttle:login') で適用する。
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by(
                Str::lower((string) $request->input('email')).'|'.$request->ip()
            );
        });
    }
}

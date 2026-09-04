<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    // HasApiTokens … Sanctum のパーソナルアクセストークン発行用（$user->createToken(...)）。
    // 認証は BFF 経由のトークン方式（docs/03-api.md）なので User に必須。
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        // role はユーザー自身の入力では変更させない想定（管理者作成・Seeder 等、信頼できる経路のみ）
        'role',
    ];

    /**
     * DB の role 列は default('customer') だが、それは INSERT 時に DB 側で決まる値であり、
     * 未保存のモデルや「create() 直後・再取得前」の PHP インスタンスには自動反映されない
     * （$this->role が null のままキャストに渡り、->value 呼び出し時に落ちる）。
     * ここでミラーしておくと、保存前でも role が常に UserRole 型で参照できる。
     * migration（users.role の default）と値を必ず一致させること。
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'role' => 'customer',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    /**
     * 住所録（複数）。ユーザー削除時に一緒に削除される（DB 側 CASCADE）。
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    /**
     * 注文履歴（複数）。
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}

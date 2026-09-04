<?php

namespace App\Enums;

/**
 * ユーザーの権限区分。管理画面（/admin, /api/admin/*）へのアクセス可否の判定に使う。
 * docs/02-database-design.md の users.role に対応。
 */
enum UserRole: string
{
    case Customer = 'customer';
    case Admin = 'admin';
}

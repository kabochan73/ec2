<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\CustomerResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerController extends Controller
{
    private const PER_PAGE = 20;

    /**
     * 会員一覧（閲覧のみ）。新しい順。クエリ: page
     */
    public function index(): AnonymousResourceCollection
    {
        $customers = User::where('role', UserRole::Customer)
            ->withCount('orders')
            ->orderByDesc('created_at')
            ->paginate(self::PER_PAGE);

        return CustomerResource::collection($customers);
    }
}

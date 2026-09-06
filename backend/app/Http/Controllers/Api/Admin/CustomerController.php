<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\CustomerResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerController extends Controller
{
    private const PER_PAGE = 50;

    /**
     * 会員一覧（閲覧のみ）。新しい順。クエリ: q（name / email の部分一致）/ page
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::where('role', UserRole::Customer)
            ->withCount('orders')
            ->orderByDesc('created_at');

        if ($q = $request->string('q')->toString()) {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        return CustomerResource::collection($query->paginate(self::PER_PAGE));
    }
}

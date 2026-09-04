<?php

namespace App\Http\Controllers\Api;

use App\Actions\Address\CreateAddress;
use App\Actions\Address\DeleteAddress;
use App\Actions\Address\SetDefaultAddress;
use App\Actions\Address\UpdateAddress;
use App\Http\Controllers\Controller;
use App\Http\Requests\Address\StoreAddressRequest;
use App\Http\Requests\Address\UpdateAddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class AddressController extends Controller
{
    /**
     * 一覧。is_default を先頭にする（docs/03-api.md）。
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $addresses = $request->user()->addresses()
            ->orderByDesc('is_default')
            ->orderBy('id')
            ->get();

        return AddressResource::collection($addresses);
    }

    public function store(StoreAddressRequest $request, CreateAddress $action): JsonResponse
    {
        $address = $action->execute($request->user(), $request->validated());

        return AddressResource::make($address)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateAddressRequest $request, Address $address, UpdateAddress $action): AddressResource
    {
        // 所有権チェックは UpdateAddressRequest::authorize() 側で済んでいる
        $address = $action->execute($address, $request->validated());

        return AddressResource::make($address);
    }

    public function destroy(Request $request, Address $address, DeleteAddress $action): Response
    {
        $this->authorizeOwnership($request, $address);

        $action->execute($address);

        return response()->noContent();
    }

    public function setDefault(Request $request, Address $address, SetDefaultAddress $action): AddressResource
    {
        $this->authorizeOwnership($request, $address);

        $address = $action->execute($address);

        return AddressResource::make($address);
    }

    /**
     * 本人の住所以外は「存在しない」のと同じ見え方にする（404）。
     * update() はボディがあるので UpdateAddressRequest::authorize() に同じチェックを持たせているが、
     * destroy / setDefault はボディが無く専用の FormRequest を作るまでもないので、ここで直接チェックする。
     */
    private function authorizeOwnership(Request $request, Address $address): void
    {
        abort_unless($address->user_id === $request->user()->id, 404);
    }
}

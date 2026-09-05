<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * S3互換バケット（ローカルは MinIO、本番は Railway Storage Bucket）の薄いラッパー。
 * docs/06 §2 の「Service を使うのは外部システムの凝集したラッパーのみ」に該当する唯一の Service。
 */
class StorageService
{
    /**
     * 商品画像を保存し、バケットのオブジェクトキー（path）を返す。
     * キー形式は products/{product_id}/{ulid}.{ext}（docs/05-admin.md）。
     * slug 変更の影響を受けないよう product_id を使う。
     */
    public function storeProductImage(int $productId, UploadedFile $file): string
    {
        $filename = Str::ulid().'.'.$file->extension();

        $path = Storage::disk('s3')->putFileAs("products/{$productId}", $file, $filename);

        if ($path === false) {
            throw new RuntimeException('画像の保存に失敗しました。');
        }

        return $path;
    }

    public function delete(string $path): void
    {
        Storage::disk('s3')->delete($path);
    }
}

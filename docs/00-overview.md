# EC-Portfolio — プロジェクト概要

架空のミニマル・アパレルブランドのECサイト。ポートフォリオ用に3〜4回作り直してブラッシュアップする。

これは **2回目（R2）**。スコープと主要スタックは R1（`../../ec1/`）と同一のまま、実装の質・設計の一貫性を上げることを狙う。機能追加（決済・検索など）はしない。R1 から変えるのは実行基盤まわり:

- ローカル開発環境を全面 Docker 化（`docker compose up -d` のみ。`07-local-dev.md`）
- backend のアプリサーバーを FrankenPHP / Octane から **nginx + php-fpm** に変更。イメージは `serversideup/php:8.4-fpm-nginx` をローカル・本番で共用（`04` / `rebuild-log.md`）

## 技術スタック

| 層 | 技術 |
|---|---|
| フロントエンド | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| 状態管理（カート） | Zustand + localStorage 永続化 |
| フォーム / 検証 | react-hook-form + @hookform/resolvers + zod（全フォームのクライアント検証） |
| クライアントデータ取得 | TanStack Query（`/admin` テーブル・`/account` CRUD・カート再検証のみ。商品閲覧は Server Component の直 fetch） |
| 画像プロキシ | @aws-sdk/client-s3（Next.js `/media/[...key]` がバケットから GetObject） |
| アイコン | lucide-react |
| バックエンド | Laravel 12 (API専用) + Sanctum（トークン認証） |
| バックエンド画像保存 | Flysystem S3 ドライバ（`league/flysystem-aws-s3-v3`） |
| DB | PostgreSQL 16 |
| 画像ストレージ | Railway Storage Bucket（private・S3互換）。Next.js の `/media` プロキシ経由で配信 |
| backend アプリサーバー | nginx + php-fpm（`serversideup/php:8.4-fpm-nginx` をローカル・本番で共用。Octane は使わない） |
| ローカル実行形態 | すべて Docker。`docker compose up -d` だけで frontend / backend / db / minio が起動（ホストに PHP / Node 不要） |
| 本番実行形態 | Railway（Docker デプロイ。backend は serversideup イメージにコードを焼き込んだ薄い Dockerfile） |
| デプロイ | Railway（frontend / backend / postgres / bucket、Dockerデプロイ） |

上記は確定。R2 では原則ライブラリを増やさない（増やす場合は rebuild-log に理由を残す）。

## アーキテクチャ方針

- **BFFパターン**: ブラウザは Next.js とだけ通信。Next.js のサーバー側（Route Handler / Server Component）が Laravel API を呼ぶ。
- Laravel は公開せず Railway の内部ネットワークのみに配置。
- 認証トークンは Next.js が httpOnly Cookie で保持し、サーバー側で `Authorization: Bearer` を付与。

## R2 のスコープ

**「決済以外は作る」**（R1 と同一）。

含む: 商品閲覧（カテゴリ/一覧/詳細）、カート、会員登録・ログイン、チェックアウト（配送先入力・注文確定、`status = pending` で orders 作成）、マイページ（注文履歴・住所録CRUD・プロフィール編集）、ブランド紹介（`/` トップページ内に統合、独立ページなし）、**管理者ページ**（Next.js 自作 `/admin`。商品・カテゴリ・注文・会員の管理）。

商品はユニセックス。性別（MEN/WOMEN）の区別なし。カテゴリは Tops / Bottoms / Outerwear / Accessories の4つ（フラット）。各カテゴリ 3〜6 点、画像はユーザー提供。参考サイトは yz-store.com/collections/9090（コレクションページと商品詳細の構成）。

含まない: 決済（Stripe等）、お気に入り、ゲスト注文、レビュー、クーポン、検索（ダミーUIも置かない）。

## デザイン方針

Balenciaga 公式サイトを参照した硬質なミニマル・モノトーン。

- 配色は `#000 / #fff / #f4f4f4 / #767676` のみ、区切りは原則ボーダー
- 細いサンセリフ、全大文字、字間広め（tracking）
- 極端な余白、フルスクリーンのヒーロー画像
- アニメーションは opacity と画像差し替えのみ

## ドキュメント

- `01-sitemap-pages.md` — サイトマップと各ページの構成
- `02-database-design.md` — テーブル定義と ER
- `03-api.md` — API エンドポイント一覧
- `04-deployment-railway.md` — Railway + Docker 本番デプロイ構成
- `05-admin.md` — 管理者ページ（`/admin`）と画像ストレージ
- `06-laravel-design.md` — Laravel 側の設計指針（レイヤー構成 / Action・Service / 命名規約）
- `07-local-dev.md` — ローカル開発環境（すべて Docker、`docker compose up -d`）
- `08-frontend-design.md` — フロントエンド設計（ディレクトリ構成 / データ取得 / 認証 / カート / スタイル）
- `rebuild-log.md` — 各イテレーションの記録

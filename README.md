# EC-PORTFOLIO（R2）

架空のミニマル・アパレルブランドの EC サイト。ポートフォリオ用の作り直し **2回目**。

- 設計ドキュメント: [`docs/`](./docs/)
- 1回目: `../ec1/`
- スタック: Next.js 15 (App Router) + Laravel 12 (API) + PostgreSQL 16 + S3互換ストレージ
- アーキテクチャ: BFF（ブラウザ ↔ Next.js ↔ Laravel）

## ディレクトリ構成（予定）

```
ec2/
├── docker-compose.yml   # ローカル開発環境（全サービス）
├── frontend/            # Next.js
├── backend/             # Laravel（serversideup/php イメージで実行）
└── docs/                # 設計ドキュメント
```

## ローカル開発

**すべて Docker。ホストに PHP / Node / Composer は不要。**

```bash
docker compose up -d
```

- frontend: http://localhost:3000
- backend: http://localhost:8000 （BFF のため通常はブラウザから触らない。curl / MCP 用）
- MinIO コンソール: http://localhost:9001

artisan / composer / npm などは `docker compose exec` 経由で叩く。詳細は [`docs/07-local-dev.md`](./docs/07-local-dev.md)。

## R1 との違い

スコープ・主要スタックは R1 と同一（決済・検索・お気に入り・レビューはやらない）。変更点は実行基盤のみ:

- ローカル開発環境を全面 Docker 化（`docker compose up -d` だけ）
- backend のアプリサーバーを FrankenPHP/Octane → `serversideup/php:8.4-fpm-nginx`

## 進捗

実装ログは [`docs/rebuild-log.md`](./docs/rebuild-log.md) を参照。

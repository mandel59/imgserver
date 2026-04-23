# imgserver - Image Server

## Overview
BunとHonoを使用した画像表示Webサーバーです。指定したディレクトリの画像をWebブラウザで閲覧できます。

このアプリはClineとDeepSeekのアシストによって作られました。

このリポジトリにはChatGPTの生成したアイコン画像が含まれています。

## Run

```npx
npx github:mandel59/imgserver --dir /path/to/images
```

設定ファイルを使う場合は `--config` を指定します。

```bash
npx github:mandel59/imgserver --config ./imgserver.toml
```

## Features
- 画像ディレクトリの指定可能
- Reactベースの画像ビューア
- ホットリロード対応の開発サーバー
- シンプルなAPIエンドポイント

## Tech Stack
- **Runtime**: Bun
- **Backend**: Hono
- **Frontend**: React 19
- **State Management**: Jotai
- **Data Fetching**: TanStack Query

## Project Structure

```
imgserver/
├── backend/          # バックエンドサーバ゙ー関連
│   └── app.ts        # Honoアプリケーション
├── frontend/         # フロントエンド関連
│   └── finder/       # 画像ビューア
│       ├── api.ts    # APIクライアント
│       ├── Finder.tsx # メインコンポーネント
│       ├── ImageModal.tsx # 画像モーダル
│       └── ...       # その他コンポーネント
├── docs/             # ドキュメント
├── images/           # 画像格納ディレクトリ
├── index.ts          # エントリーポイント
└── package.json      # 依存関係
```

## Development

### Setup

```bash
bun install
```

### Run develop server

```bash
bun dev
```

`bun dev` で起動した場合はデフォルトで`images/`ディレクトリの画像を表示します。
別のディレクトリを指定するには:

```bash
bun dev --dir /path/to/images
```

### Config file

`--config` では `.json` / `.jsonc` / `.toml` / `.yaml` / `.yml` を指定できます。
設定値の優先順位は `コマンド引数 > 設定ファイル > 既定値` です。

```toml
host = "0.0.0.0"
port = 8000
dir = "./images"
logging = "/.be/api/*"
development = true
keepMetadata = false
showMetadata = false
corsOrigin = ["https://example.com"]
cacheMaxAge = 300
```

`dir` は設定ファイルの場所からの相対パスとして解決されます。CLI の `--dir` は従来どおりカレントディレクトリ基準です。
画像モーダルでメタデータを表示する場合は `showMetadata = true` または `--showMetadata` を指定します。

## License

MIT

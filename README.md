# imgserver - Image Server

## Overview
Bun と Hono を使用した画像表示 Web サーバーです。指定したディレクトリの画像をブラウザで閲覧できます。

このアプリはClineとDeepSeekのアシストによって作られました。

このリポジトリにはChatGPTの生成したアイコン画像が含まれています。

## Features
- 指定ディレクトリ内の画像とサブディレクトリをブラウザで閲覧
- ZIP ファイルをディレクトリのように開いて、ZIP 内の画像を閲覧
- JPEG / PNG / WebP / GIF / AVIF / TIFF 画像の表示
- 画像配信 API でのリサイズ、fit 指定、PNG / JPEG / WebP / AVIF への形式変換
- Sharp による画像メタデータ除去。`keepMetadata` で元メタデータ保持も可能
- `showMetadata` 有効時のメタデータ表示。画像形式、サイズ、寸法、色空間、PNG テキストチャンク、XMP などを確認可能
- `corsOrigin` による画像配信 API の CORS 設定
- `cacheMaxAge` による画像レスポンスの `Cache-Control` 設定
- JSON / JSONC / TOML / YAML の設定ファイル対応
- Hono logger による任意パスのアクセスログ出力

## Usage

### Run with npx

```npx
npx github:mandel59/imgserver --dir /path/to/images
```

設定ファイルを使う場合は `--config` を指定します。設定ファイル内の `dir` は設定ファイルの場所からの相対パスとして解決されます。

```bash
npx github:mandel59/imgserver --config ./imgserver.toml
```

### CLI options

CLI オプションは設定ファイルより優先されます。

| Option | Value | Default | Description |
| --- | --- | --- | --- |
| `--config`, `-c` | path | なし | 設定ファイルを読み込みます。`.json` / `.jsonc` / `.toml` / `.yaml` / `.yml` に対応します。 |
| `--host`, `-h` | string | `127.0.0.1` | サーバーを bind するホストです。 |
| `--port`, `-p` | number/string | `8000` | サーバーのポートです。 |
| `--dir`, `-d` | path | `.` | 画像ディレクトリです。CLI ではカレントディレクトリ基準で解決されます。 |
| `--logging` | path pattern | なし | Hono logger を適用するパスです。例: `/.be/api/*` |
| `--development` | boolean flag | `false` | Bun.serve とフロントエンドビルドを開発モードで実行します。 |
| `--keepMetadata` | boolean flag | `false` | 配信時に Sharp の `keepMetadata()` を有効にします。 |
| `--showMetadata` | boolean flag | `false` | UI と API で画像メタデータ表示を有効にします。 |
| `--corsOrigin` | string, repeatable | `[]` | `/.be/images/*` の CORS 許可 origin です。`*` も指定できます。 |
| `--cacheMaxAge` | seconds | `60` | 画像レスポンスに付ける `Cache-Control: max-age=<seconds>, immutable` の秒数です。0 以下または不正な値では無効になります。 |

例:

```bash
npx github:mandel59/imgserver \
  --host 0.0.0.0 \
  --port 8000 \
  --dir /path/to/images \
  --showMetadata \
  --corsOrigin https://example.com \
  --cacheMaxAge 300
```

### Image API options

画像は `/.be/images/<path>` から配信されます。必要に応じて以下のクエリを指定できます。

| Query | Value | Description |
| --- | --- | --- |
| `width` | 1-4000 | リサイズ後の幅です。 |
| `height` | 1-4000 | リサイズ後の高さです。 |
| `fit` | `cover` / `contain` / `fill` / `inside` / `outside` | Sharp の resize fit です。未指定時は `inside` です。 |
| `format` | `png` / `jpeg` / `webp` / `avif` | レスポンス画像形式を変換します。 |
| `archive` | path | ZIP 内の画像を読むときの ZIP ファイルパスです。 |
| `encoding` | encoding name | ZIP 内ファイル名の文字コードです。未指定時は `shift_jis` です。 |

## Tech Stack
- **Runtime**: Bun
- **Backend**: Hono
- **Frontend**: React 19
- **State Management**: Jotai
- **Data Fetching**: TanStack Query

## Project Structure

```
imgserver/
├── backend/          # バックエンドサーバー関連
│   └── app.ts        # Hono アプリケーション
├── frontend/         # フロントエンド関連
│   └── finder/       # 画像ビューア
│       ├── api.ts    # API クライアント
│       ├── Finder.tsx # メインコンポーネント
│       ├── ImageModal.tsx # 画像モーダル
│       └── ...       # その他コンポーネント
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

`bun dev` で起動した場合はデフォルトで `images/` ディレクトリの画像を表示し、`/.be/api/*` のアクセスログと開発モードが有効になります。
別のディレクトリを指定するには:

```bash
bun dev --dir /path/to/images
```

### Config file

`--config` では `.json` / `.jsonc` / `.toml` / `.yaml` / `.yml` を指定できます。設定値の優先順位は `CLI オプション > 設定ファイル > 既定値` です。

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

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `host` | string | `127.0.0.1` | サーバーを bind するホストです。 |
| `port` | string or number | `8000` | サーバーのポートです。 |
| `dir` | string | `.` | 画像ディレクトリです。設定ファイルの場所からの相対パスとして解決されます。 |
| `logging` | string | なし | Hono logger を適用するパスです。例: `/.be/api/*` |
| `development` | boolean | `false` | Bun.serve とフロントエンドビルドを開発モードで実行します。 |
| `keepMetadata` | boolean | `false` | 配信時に Sharp の `keepMetadata()` を有効にします。 |
| `showMetadata` | boolean | `false` | UI と API で画像メタデータ表示を有効にします。 |
| `corsOrigin` | string or string[] | `[]` | `/.be/images/*` の CORS 許可 origin です。`*` も指定できます。 |
| `cacheMaxAge` | string or number | `60` | 画像レスポンスに付ける `Cache-Control` の `max-age` 秒数です。0 以下または不正な値では無効になります。 |

## License

MIT

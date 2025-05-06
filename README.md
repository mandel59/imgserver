# imgserver - Image Server

## Overview
BunとHonoを使用した画像表示Webサーバーです。指定したディレクトリの画像をWebブラウザで閲覧できます。

このアプリはClineとDeepSeekのアシストによって作られました。

このリポジトリにはChatGPTの生成したアイコン画像が含まれています。

## Run

```npx
npx github:mandel59/imgserver --dir /path/to/images
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

## License

MIT

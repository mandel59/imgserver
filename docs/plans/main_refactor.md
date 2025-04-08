# main.ts リファクタリング計画

## 現在の状況
- `main.ts` は画像ビューアの主要ロジックを含む
- 既に `fetchItems` 関数を `api.ts` に移動済み
- ファイルサイズが大きく、以下の責務を含む:
  - UIレンダリング (renderItemList)
  - 状態管理 (updateAppState)
  - イベントハンドリング
  - モーダル管理
  - スクロール位置管理

## 問題点
- 単一ファイルが多機能を担っている
- コードの見通しが悪い
- テストが困難
- 機能追加時に影響範囲が大きい

## 提案する分割方法

### 新しいファイル構成
```
static/scripts/
├── main.ts          # エントリポイント
├── api.ts           # API通信関連
├── types.ts         # 型定義
├── render/          # UIレンダリング関連
│   ├── itemList.ts  # アイテム一覧表示
│   └── modal.ts     # モーダル表示
├── state/           # 状態管理
│   ├── appState.ts  # アプリケーション状態
│   └── scroll.ts    # スクロール位置管理
└── events/          # イベントハンドリング
    ├── keyboard.ts  # キーボード操作
    └── hammer.ts    # タッチ操作
```

## 実施手順

1. UIレンダリング関連の分割
   - `renderItemList` 関数を `render/itemList.ts` に移動
   - モーダル関連を `render/modal.ts` に移動

2. 状態管理の分割
   - `updateAppState` を `state/appState.ts` に移動
   - スクロール位置管理を `state/scroll.ts` に移動

3. イベントハンドリングの分割
   - キーボードイベントを `events/keyboard.ts` に移動
   - タッチイベントを `events/hammer.ts` に移動

4. メインエントリポイントの整理
   - `main.ts` は各モジュールの初期化のみを行う

## 期待する効果
- コードの見通しが向上
- テスト容易性の向上
- 機能追加時の影響範囲の限定
- チーム開発時のコンフリクト低減

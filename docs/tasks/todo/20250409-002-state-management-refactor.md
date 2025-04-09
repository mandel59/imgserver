# 状態管理のリファクタリング

## タスク内容
1. `updateAppState` 関数を `state/appState.ts` に移動
2. スクロール位置管理コードを `state/scroll.ts` に移動
3. 状態関連の型定義を整理
4. 各モジュール間の依存関係を整理

## 関連ファイル
- static/scripts/main.ts
- static/scripts/state/appState.ts (新規作成)
- static/scripts/state/scroll.ts (新規作成)
- static/scripts/types.ts

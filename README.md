# Game Launcher

汎用的なゲームランチャーアプリケーション。複数のウェブゲームとユーザースクリプト（Tampermonkey/Violentmonkey形式）をサポートします。

## 機能

### ゲーム管理
- 複数のウェブゲーム（Miniblox, Bloxd等）をサポート
- カスタムゲームの追加が可能
- ゲームごとに異なるプロファイルを使用可能

### プロファイル管理
- 複数のプロファイルを作成・管理
- プロファイルごとに異なるユーザースクリプトを設定
- デフォルトプロファイル（削除・編集不可）が標準で用意
- 外部JSONファイルまたはURLからプロファイルをインポート

### ユーザースクリプト
- Tampermonkey/Violentmonkey互換のユーザースクリプトをサポート
- スクリプトの追加、編集、削除、名前変更
- URLから直接スクリプトをインポート
- メタデータに基づく自動更新機能（@updateURL対応）

## 使い方

### インストール
```bash
npm install
```

### 開発モードで起動
```bash
npm start
```

### ビルド
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## UI構成

### 左パネル
- **Launcher**: アプリケーションタイトル
- **ゲームリスト**: 登録されているゲームの一覧
- **+ ゲームを追加**: 新しいゲームを追加
- **設定**: アプリケーション設定（今後実装予定）

### 右パネル

#### Homeタブ
- ゲーム名の表示
- プロファイル選択ドロップダウン
- **Play**ボタン: 選択したゲームとプロファイルで起動

#### Profileタブ
- **プロファイル管理**
  - プロファイルの追加
  - 外部からのプロファイル取り込み
  - プロファイルの切り替え
  
- **ユーザースクリプト管理**
  - スクリプトの追加（手動入力）
  - URLからスクリプトをインポート
  - スクリプトの編集
  - スクリプトの名前変更
  - スクリプトの削除
  - スクリプトの更新（@updateURL設定時）

## プロファイルJSON形式

外部取り込み用のプロファイルは以下の形式で作成してください：

```json
{
  "name": "My Profile",
  "locked": false,
  "scripts": [
    {
      "name": "Script Name",
      "code": "// ==UserScript==\n// @name Script Name\n// @version 1.0\n// ==/UserScript==\n\nconsole.log('Hello');",
      "updateUrl": "https://example.com/script.js"
    }
  ]
}
```

## ユーザースクリプト形式

Tampermonkey/Violentmonkey互換のメタデータをサポート：

```javascript
// ==UserScript==
// @name         My Script
// @version      1.0.0
// @description  Script description
// @updateURL    https://example.com/script.js
// ==/UserScript==

// Your code here
console.log('Script loaded');
```

## 技術スタック

- Electron 28.0.0
- Node.js
- HTML/CSS/JavaScript

## ライセンス

MIT

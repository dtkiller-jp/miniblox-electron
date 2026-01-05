# miniblox.io Electron App

miniblox.ioをElectronアプリ化し、ユーザースクリプトを注入できるようにしたアプリケーションです。

## 機能

- バージョンセレクターでユーザースクリプトのバージョンを選択
- GitHubからバージョンリストを更新
- 選択したユーザースクリプトをminiblox.ioに注入して起動

## セットアップ

```bash
npm install
```

## 実行

```bash
npm start
```

## バージョン設定

`versions.json`ファイルでバージョンとURLを管理します。
更新ボタンで指定のGitHubリンクから最新のバージョンリストを取得できます。

## 構成

- `main.js` - メインプロセス
- `selector.html` - バージョンセレクターUI
- `selector-renderer.js` - セレクターのレンダラープロセス
- `selector-preload.js` - セレクター用プリロードスクリプト
- `preload.js` - メインウィンドウ用プリロードスクリプト（ユーザースクリプト注入）
- `versions.json` - バージョン設定ファイル

# miniblox.io Electron App

miniblox.ioをElectronアプリ化し、ユーザースクリプトを注入できるようにしたアプリケーションです。

## Features

- Version selector for userscripts
- Custom loading screen with progress tracking
- Persistent storage for configs and cookies
- Greasemonkey/Tampermonkey API compatibility

## Setup

```bash
npm install
```

## Development

```bash
npm start
```

## Build

Windows:
```bash
npm run build:win
```

Mac:
```bash
npm run build:mac
```

Linux:
```bash
npm run build:linux
```

All platforms:
```bash
npm run build
```

ビルドされたファイルは `dist/` フォルダに出力されます。

## Version Configuration

`versions.json` でバージョンとURLを管理します。
セレクター画面の更新ボタンで指定のGitHubリンクから最新のバージョンリストを取得できます。

## Files

- `main.js` - Main process
- `selector.html` - Version selector UI
- `selector-renderer.js` - Selector renderer process
- `selector-preload.js` - Selector preload script
- `loading.html` - Custom loading screen
- `preload.js` - Main window preload script (userscript injection)
- `versions.json` - Version configuration file

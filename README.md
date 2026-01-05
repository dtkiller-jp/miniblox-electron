# miniblox.io Electron App

An Electron-based desktop application for miniblox.io with userscript injection support.

## Features

- Version selector for userscripts with auto-update on startup
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

Built files will be output to the `dist/` folder.

## Version Configuration

Manage versions and URLs in `versions.json`.
The app automatically checks for version updates on startup from the specified GitHub link.

## Files

- `main.js` - Main process
- `selector.html` - Version selector UI
- `selector-renderer.js` - Selector renderer process
- `selector-preload.js` - Selector preload script
- `loading.html` - Custom loading screen
- `preload.js` - Main window preload script (userscript injection)
- `versions.json` - Version configuration file

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

## Antivirus False Positives

If your antivirus (McAfee, Windows Defender, etc.) flags the installer:

1. **This is a false positive** - The app is not signed with a code signing certificate (costs $300+/year)
2. **Safe to use** - All source code is available in this repository
3. **To install:**
   - Add an exception in your antivirus for the installer
   - Or temporarily disable real-time protection during installation
   - Windows SmartScreen: Click "More info" → "Run anyway"

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

# Web Game Launcher & Mod Manager

A universal game launcher application that supports multiple web games and userscripts (Tampermonkey/Violentmonkey format).

## Features

### Game Management
- Support for multiple web games (Miniblox, Bloxd, etc.)
- Add custom games
- Use different profiles for each game
- Delete games with associated profiles
- Per-game profile isolation

### Profile Management
- Create and manage multiple profiles
- Configure different userscripts for each profile
- Default profile (locked, cannot be deleted or edited)
- Import profiles from external JSON files or URLs
- Export profiles as JSON files
- Rename and delete custom profiles

### Userscript Support
- Tampermonkey/Violentmonkey compatible userscripts
- Add, edit, delete, and rename scripts
- Import scripts directly from URLs
- Auto-update based on metadata (@updateURL support)
- @require dependency loading
- @run-at timing control (document-start, document-body, document-end, document-idle)
- GM API compatibility (GM.getValue, GM.setValue, GM.xmlHttpRequest, etc.)

## Installation

### Prerequisites
```bash
npm install
```

### Development Mode
```bash
npm start
```

### Build
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## UI Overview

### Left Panel
- **Launcher**: Application title
- **Game List**: List of registered games with delete buttons
- **+ Add Game**: Add a new game
- **Settings**: Application settings (coming soon)

### Right Panel

#### Home Tab
- Game name display
- Profile selection dropdown
- **Play** button: Launch the selected game with the chosen profile

#### Profile Tab
- **Profile Management**
  - Add new profiles
  - Import profiles from external sources
  - Export profiles as JSON
  - Rename profiles
  - Delete profiles
  - Switch between profiles
  
- **Userscript Management**
  - Add scripts (manual input)
  - Import scripts from URL
  - Edit scripts
  - Rename scripts
  - Delete scripts
  - Update scripts (@updateURL support)

## Profile JSON Format

For importing profiles, use the following format:

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

## Userscript Format

Supports Tampermonkey/Violentmonkey compatible metadata:

```javascript
// ==UserScript==
// @name         My Script
// @version      1.0.0
// @description  Script description
// @updateURL    https://example.com/script.js
// @require      https://example.com/library.js
// @run-at       document-end
// ==/UserScript==

// Your code here
console.log('Script loaded');
```

### Supported Metadata Tags
- `@name` - Script name
- `@version` - Script version
- `@description` - Script description
- `@updateURL` - URL for auto-updates
- `@require` - External script dependencies
- `@run-at` - Execution timing (document-start, document-body, document-end, document-idle)

## Technical Stack

- Electron 28.0.0
- Node.js
- HTML/CSS/JavaScript

## Security Features

- Context isolation enabled for renderer processes
- Secure IPC communication
- Sandboxed preload scripts
- HTTP redirect support for script fetching

## Known Limitations

- Settings feature is not yet implemented
- `webSecurity: false` is intentionally set for game compatibility

## License

MIT

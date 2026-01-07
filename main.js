const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

let selectorWindow = null;
let mainWindow = null;

// Configuration file path
const configPath = path.join(app.getPath('userData'), 'config.json');

// Default configuration
const defaultConfig = {
  games: [
    { id: 'miniblox', name: 'Miniblox', url: 'https://miniblox.io' },
    { id: 'bloxd', name: 'Bloxd', url: 'https://bloxd.io' }
  ],
  profiles: {
    default: {
      name: 'default',
      locked: true,
      scripts: []
    }
  }
};

// Load configuration
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return defaultConfig;
}

// Save configuration
function saveConfig(config) {
  try {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

// Create selector window
function createSelectorWindow() {
  selectorWindow = new BrowserWindow({
    width: 900,
    height: 600,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'selector-preload.js')
    }
  });

  selectorWindow.loadFile('selector.html');
  selectorWindow.setMenuBarVisibility(false);

  selectorWindow.on('closed', () => {
    selectorWindow = null;
    if (!mainWindow) {
      app.quit();
    }
  });
}

// Create main window
function createMainWindow(gameUrl, scripts, gameName) {
  console.log('Creating main window for:', gameUrl);
  console.log('Game name:', gameName);
  console.log('Scripts:', scripts.length);
  
  // Function to fetch @require scripts
  const fetchRequire = (url) => {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      protocol.get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  };
  
  // Parse metadata and fetch @require scripts
  const processScripts = async () => {
    let combinedScript = '';
    
    for (let index = 0; index < scripts.length; index++) {
      const script = scripts[index];
      console.log(`Script ${index + 1}: ${script.name}, code length: ${script.code?.length || 0}`);
      
      combinedScript += `\n// ===== Script ${index + 1}: ${script.name} =====\n`;
      
      // Parse @require from metadata
      const requires = [];
      const metaBlock = script.code.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
      if (metaBlock) {
        const metaContent = metaBlock[1];
        const lines = metaContent.split('\n');
        lines.forEach(line => {
          const match = line.match(/\/\/ @require\s+(.+)/);
          if (match) {
            requires.push(match[1].trim());
          }
        });
      }
      
      // Fetch and add @require scripts
      for (const requireUrl of requires) {
        try {
          console.log(`Fetching @require: ${requireUrl}`);
          const requireCode = await fetchRequire(requireUrl);
          console.log(`Fetched @require, length: ${requireCode.length}`);
          combinedScript += `\n// @require: ${requireUrl}\n`;
          combinedScript += requireCode + '\n';
        } catch (e) {
          console.error(`Failed to fetch @require: ${requireUrl}`, e);
        }
      }
      
      // Add the userscript itself
      combinedScript += script.code + '\n';
    }
    
    console.log('Combined script total length:', combinedScript.length);
    
    // Save to temporary file
    const tempScriptPath = path.join(app.getPath('temp'), 'userscripts.js');
    fs.writeFileSync(tempScriptPath, combinedScript, 'utf8');
    console.log('Scripts saved to:', tempScriptPath);
    
    return tempScriptPath;
  };
  
  // Process scripts and create window
  processScripts().then(tempScriptPath => {
    createMainWindowWithScript(gameUrl, gameName, tempScriptPath);
  }).catch(error => {
    console.error('Failed to process scripts:', error);
  });
}

// Create main window with processed script
function createMainWindowWithScript(gameUrl, gameName, tempScriptPath) {
  let progressTimeout = null;
  
  // Loading window
  const loadingWindow = new BrowserWindow({
    width: 600,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  loadingWindow.loadFile('loading.html');
  
  // Send game name to loading window
  loadingWindow.webContents.on('did-finish-load', () => {
    if (loadingWindow && !loadingWindow.isDestroyed() && loadingWindow.webContents && !loadingWindow.webContents.isDestroyed()) {
      loadingWindow.webContents.send('game-name', gameName);
    }
  });
  
  // Main window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: [`--userscript-path=${tempScriptPath}`],
      sandbox: false,
      allowRunningInsecureContent: true
    }
  });

  let loadingProgress = 0;
  
  // Monitor console messages
  mainWindow.webContents.on('console-message', (_event, _level, message) => {
    console.log('Console:', message);
    
    // Generic loading detection
    if ((message.includes('Loading') || message.includes('loading')) && loadingProgress < 33) {
      loadingProgress = 33;
      if (progressTimeout) clearTimeout(progressTimeout);
      if (loadingWindow && !loadingWindow.isDestroyed() && loadingWindow.webContents && !loadingWindow.webContents.isDestroyed()) {
        loadingWindow.webContents.send('loading-progress', {
          progress: loadingProgress,
          status: 'Loading...'
        });
      }
    } else if ((message.includes('Initializing') || message.includes('initializing') || message.includes('Init')) && loadingProgress < 66) {
      loadingProgress = 66;
      if (progressTimeout) clearTimeout(progressTimeout);
      if (loadingWindow && !loadingWindow.isDestroyed() && loadingWindow.webContents && !loadingWindow.webContents.isDestroyed()) {
        loadingWindow.webContents.send('loading-progress', {
          progress: loadingProgress,
          status: 'Initializing...'
        });
      }
    } else if (message.includes('Ready') || message.includes('Initialized') || message.includes('Complete') || message.includes('loaded')) {
      loadingProgress = 100;
      if (progressTimeout) clearTimeout(progressTimeout);
      if (loadingWindow && !loadingWindow.isDestroyed() && loadingWindow.webContents && !loadingWindow.webContents.isDestroyed()) {
        loadingWindow.webContents.send('loading-progress', {
          progress: loadingProgress,
          status: 'Ready!'
        });
      }
      
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
        }
        if (loadingWindow && !loadingWindow.isDestroyed()) {
          loadingWindow.close();
        }
      }, 500);
    }
  });

  console.log('Loading URL:', gameUrl);
  mainWindow.loadURL(gameUrl);

  mainWindow.on('closed', () => {
    console.log('Main window closed');
    mainWindow = null;
    if (loadingWindow && !loadingWindow.isDestroyed()) {
      loadingWindow.close();
    }
    // Clean up temporary file
    try {
      if (fs.existsSync(tempScriptPath)) {
        fs.unlinkSync(tempScriptPath);
      }
    } catch (e) {
      console.error('Failed to delete temp file:', e);
    }
  });
  
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    if (loadingWindow && !loadingWindow.isDestroyed() && loadingWindow.webContents && !loadingWindow.webContents.isDestroyed()) {
      loadingWindow.webContents.send('loading-progress', {
        progress: 0,
        status: 'Failed to load'
      });
    }
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
    if (loadingProgress === 0) {
      loadingProgress = 10;
      if (loadingWindow && !loadingWindow.isDestroyed() && loadingWindow.webContents && !loadingWindow.webContents.isDestroyed()) {
        loadingWindow.webContents.send('loading-progress', {
          progress: 10,
          status: 'Page loaded...'
        });
      }
      
      // Automatically show after 5 seconds if no progress
      if (progressTimeout) clearTimeout(progressTimeout);
      progressTimeout = setTimeout(() => {
        if (loadingProgress < 100) {
          loadingProgress = 100;
          if (loadingWindow && !loadingWindow.isDestroyed() && loadingWindow.webContents && !loadingWindow.webContents.isDestroyed()) {
            loadingWindow.webContents.send('loading-progress', {
              progress: 100,
              status: 'Ready!'
            });
          }
          setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.show();
            }
            if (loadingWindow && !loadingWindow.isDestroyed()) {
              loadingWindow.close();
            }
          }, 300);
        }
      }, 5000);
    }
  });
}

// Fetch script
function fetchScript(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      let code = '';
      res.on('data', (chunk) => {
        code += chunk;
      });
      
      res.on('end', () => {
        // Parse metadata
        const nameMatch = code.match(/@name\s+(.+)/);
        const versionMatch = code.match(/@version\s+(.+)/);
        const updateUrlMatch = code.match(/@updateURL\s+(.+)/);
        
        resolve({
          name: nameMatch ? nameMatch[1].trim() : 'Unnamed Script',
          version: versionMatch ? versionMatch[1].trim() : '1.0',
          updateUrl: updateUrlMatch ? updateUrlMatch[1].trim() : url,
          code: code
        });
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Import profile
async function importProfile(source) {
  return new Promise((resolve, reject) => {
    if (source.startsWith('http://') || source.startsWith('https://')) {
      // Fetch from URL
      const protocol = source.startsWith('https') ? https : http;
      
      protocol.get(source, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const profile = JSON.parse(data);
            resolve(profile);
          } catch (error) {
            reject(new Error('Invalid JSON'));
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    } else {
      // Fetch from local file
      try {
        const data = fs.readFileSync(source, 'utf8');
        const profile = JSON.parse(data);
        resolve(profile);
      } catch (error) {
        reject(error);
      }
    }
  });
}

app.whenReady().then(() => {
  createSelectorWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSelectorWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('get-config', () => {
  return loadConfig();
});

ipcMain.handle('save-config', (_event, config) => {
  return saveConfig(config);
});

ipcMain.handle('launch-game', (_event, data) => {
  console.log('Launch game:', data);
  
  try {
    createMainWindow(data.gameUrl, data.scripts, data.gameName);
    
    // Close selector window
    setTimeout(() => {
      if (selectorWindow) {
        selectorWindow.close();
      }
    }, 500);
    
    return { success: true };
  } catch (error) {
    console.error('Error launching game:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fetch-script', async (_event, url) => {
  try {
    return await fetchScript(url);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('import-profile', async (_event, source) => {
  try {
    return await importProfile(source);
  } catch (error) {
    throw error;
  }
});

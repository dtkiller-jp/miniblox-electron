const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

let selectorWindow = null;
let mainWindow = null;
let selectedVersion = null;

// Default version data
const defaultVersions = {
  "versions": [
    {
      "name": "Impact v6 main",
      "url": "https://raw.githubusercontent.com/ProgMEM-CC/miniblox.impact.client.updatedv2/refs/heads/main/vav4inject.js"
    },
    {
      "name": "local test (127.0.0.1/vav4inject.js)",
      "url": "http://127.0.0.1:5500/vav4inject.js"
    }
  ],
  "updateUrl": "https://raw.githubusercontent.com/dtkiller-jp/miniblox-electron/refs/heads/main/versions.json"
};

function loadVersions() {
  const versionsPath = path.join(__dirname, 'versions.json');
  try {
    if (fs.existsSync(versionsPath)) {
      const data = fs.readFileSync(versionsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading versions file:', error);
  }
  return defaultVersions;
}

function saveVersions(data) {
  const versionsPath = path.join(__dirname, 'versions.json');
  try {
    fs.writeFileSync(versionsPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving versions file:', error);
    return false;
  }
}

function createSelectorWindow() {
  selectorWindow = new BrowserWindow({
    width: 450,
    height: 200,
    resizable: false,
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

function createMainWindow(scriptUrl) {
  console.log('Creating main window with script URL:', scriptUrl);
  
  // Download script first, then create window
  https.get(scriptUrl, (res) => {
    console.log('HTTP response status:', res.statusCode);
    
    let scriptContent = '';
    
    res.on('data', (chunk) => {
      scriptContent += chunk;
    });
    
    res.on('end', () => {
      console.log('Script downloaded, length:', scriptContent.length);
      
      try {
        // Save script to temp file
        const tempScriptPath = path.join(app.getPath('temp'), 'miniblox-userscript.js');
        fs.writeFileSync(tempScriptPath, scriptContent, 'utf8');
        console.log('Script saved to:', tempScriptPath);
        
        // Create loading window
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
        
        // Create main window (hidden initially)
        mainWindow = new BrowserWindow({
          width: 1280,
          height: 720,
          show: false,
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: true,
            preload: path.join(__dirname, 'preload.js'),
            additionalArguments: [`--userscript-path=${tempScriptPath}`],
            sandbox: false,
            partition: 'persist:miniblox'
          }
        });

        let loadingProgress = 0;
        
        // Monitor console messages for loading progress
        mainWindow.webContents.on('console-message', (event, level, message) => {
          console.log('Console:', message);
          
          if (message.includes('Loading textures')) {
            loadingProgress = 33;
            loadingWindow.webContents.send('loading-progress', {
              progress: loadingProgress,
              status: 'Loading textures...'
            });
          } else if (message.includes('Initializing graphics')) {
            loadingProgress = 66;
            loadingWindow.webContents.send('loading-progress', {
              progress: loadingProgress,
              status: 'Initializing graphics...'
            });
          } else if (message.includes('Initialized game')) {
            loadingProgress = 100;
            loadingWindow.webContents.send('loading-progress', {
              progress: loadingProgress,
              status: 'Ready!'
            });
            
            // Show main window and close loading window
            setTimeout(() => {
              mainWindow.show();
              loadingWindow.close();
            }, 500);
          }
        });

        console.log('Main window created, loading URL...');
        mainWindow.loadURL('https://miniblox.io');

        mainWindow.on('closed', () => {
          console.log('Main window closed');
          mainWindow = null;
          if (loadingWindow && !loadingWindow.isDestroyed()) {
            loadingWindow.close();
          }
          // Clean up temp file
          try {
            if (fs.existsSync(tempScriptPath)) {
              fs.unlinkSync(tempScriptPath);
            }
          } catch (e) {
            console.error('Failed to delete temp file:', e);
          }
        });
        
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
          console.error('Failed to load:', errorCode, errorDescription);
          loadingWindow.webContents.send('loading-progress', {
            progress: 0,
            status: 'Failed to load'
          });
        });
        
        mainWindow.webContents.on('did-finish-load', () => {
          console.log('Page loaded successfully');
          if (loadingProgress === 0) {
            loadingWindow.webContents.send('loading-progress', {
              progress: 10,
              status: 'Page loaded...'
            });
          }
        });
        
        mainWindow.webContents.on('crashed', (event, killed) => {
          console.error('Renderer process crashed, killed:', killed);
        });
      } catch (error) {
        console.error('Error creating window:', error);
      }
    });
  }).on('error', (error) => {
    console.error('Failed to download script:', error);
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
ipcMain.handle('get-versions', () => {
  return loadVersions();
});

ipcMain.handle('update-versions', async (event, updateUrl) => {
  return new Promise((resolve) => {
    https.get(updateUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const versions = JSON.parse(data);
          if (saveVersions(versions)) {
            resolve({ success: true, data: versions });
          } else {
            resolve({ success: false, error: 'Failed to save' });
          }
        } catch (error) {
          resolve({ success: false, error: 'Failed to parse JSON' });
        }
      });
    }).on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
  });
});

ipcMain.handle('launch-app', (event, version) => {
  console.log('Launch app called with version:', version);
  selectedVersion = version;
  
  try {
    createMainWindow(version.url);
    
    // Close selector window after a short delay to ensure main window is created
    setTimeout(() => {
      if (selectorWindow) {
        selectorWindow.close();
      }
    }, 500);
    
    return { success: true };
  } catch (error) {
    console.error('Error launching app:', error);
    return { success: false, error: error.message };
  }
});

const fs = require('fs');

console.log('Preload script started');

// Get script path from command line arguments
const scriptPathArg = process.argv.find(arg => arg.startsWith('--userscript-path='));

if (scriptPathArg) {
  const scriptPath = scriptPathArg.split('=')[1];
  console.log('Script path detected:', scriptPath);
  
  try {
    // Read script content
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    console.log('Script content loaded, length:', scriptContent.length);
    
    // Define userscript manager APIs
    window.unsafeWindow = window;
    
    // GM storage using localStorage
    const GM_STORAGE_PREFIX = 'gm_';
    
    window.GM_getValue = function(key, defaultValue) {
      try {
        const value = localStorage.getItem(GM_STORAGE_PREFIX + key);
        return value !== null ? JSON.parse(value) : defaultValue;
      } catch (e) {
        console.error('GM_getValue error:', e);
        return defaultValue;
      }
    };
    
    window.GM_setValue = function(key, value) {
      try {
        localStorage.setItem(GM_STORAGE_PREFIX + key, JSON.stringify(value));
      } catch (e) {
        console.error('GM_setValue error:', e);
      }
    };
    
    window.GM_deleteValue = function(key) {
      try {
        localStorage.removeItem(GM_STORAGE_PREFIX + key);
      } catch (e) {
        console.error('GM_deleteValue error:', e);
      }
    };
    
    window.GM_listValues = function() {
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(GM_STORAGE_PREFIX)) {
            keys.push(key.substring(GM_STORAGE_PREFIX.length));
          }
        }
        return keys;
      } catch (e) {
        console.error('GM_listValues error:', e);
        return [];
      }
    };
    
    window.GM_info = {
      script: {
        name: 'Miniblox Impact',
        version: '6.0.0'
      },
      scriptHandler: 'Electron App',
      version: '1.0.0'
    };
    
    window.GM_xmlhttpRequest = function(details) {
      const xhr = new XMLHttpRequest();
      xhr.open(details.method || 'GET', details.url);
      
      if (details.headers) {
        Object.keys(details.headers).forEach(key => {
          xhr.setRequestHeader(key, details.headers[key]);
        });
      }
      
      xhr.onload = function() {
        if (details.onload) {
          details.onload({
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText,
            responseHeaders: xhr.getAllResponseHeaders()
          });
        }
      };
      
      xhr.onerror = function() {
        if (details.onerror) details.onerror(xhr);
      };
      
      xhr.send(details.data);
      return { abort: () => xhr.abort() };
    };
    
    console.log('GM APIs initialized');
    
    // Inject script at document-start (as early as possible)
    const injectScript = () => {
      try {
        console.log('Injecting userscript...');
        const script = document.createElement('script');
        script.textContent = scriptContent;
        script.type = 'text/javascript';
        (document.head || document.documentElement || document.body).appendChild(script);
        console.log('Userscript injected successfully');
      } catch (e) {
        console.error('Failed to inject script:', e);
      }
    };
    
    // Try to inject immediately
    if (document.documentElement) {
      injectScript();
    } else {
      // Wait for document to be ready
      const checkDocument = setInterval(() => {
        if (document.documentElement) {
          clearInterval(checkDocument);
          injectScript();
        }
      }, 10);
    }
    
  } catch (error) {
    console.error('Failed to load script:', error);
  }
} else {
  console.log('No script path provided');
}

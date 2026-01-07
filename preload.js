const fs = require('fs');

console.log('Preload script started');

const scriptPathArg = process.argv.find(arg => arg.startsWith('--userscript-path='));

if (scriptPathArg) {
  const scriptPath = scriptPathArg.split('=')[1];
  console.log('Script path detected:', scriptPath);
  
  try {
    const combinedScriptContent = fs.readFileSync(scriptPath, 'utf8');
    console.log('Script content loaded, length:', combinedScriptContent.length);
    
    const scriptSections = [];
    const lines = combinedScriptContent.split('\n');
    let currentScript = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^\/\/ ===== Script \d+: (.+?) =====$/);
      
      if (match) {
        if (currentScript) {
          scriptSections.push(currentScript);
        }
        currentScript = { name: match[1], content: '' };
      } else if (currentScript) {
        currentScript.content += line + '\n';
      }
    }
    
    if (currentScript) {
      currentScript.content = currentScript.content.trim();
      scriptSections.push(currentScript);
    }
    
    console.log('Found', scriptSections.length, 'scripts');
    
    const scriptsWithMetadata = scriptSections.map(section => {
      const metadata = { name: section.name, runAt: 'document-end' };
      
      const metaBlock = section.content.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
      if (metaBlock) {
        metaBlock[1].split('\n').forEach(line => {
          const m = line.match(/\/\/ @run-at\s+(.+)/);
          if (m) metadata.runAt = m[1].trim();
        });
      }
      
      return { metadata, content: section.content };
    });
    
    const injectScript = (content) => {
      const target = document.head || document.documentElement;
      if (target) {
        const script = document.createElement('script');
        script.textContent = content;
        target.appendChild(script);
      }
    };
    
    const gmApi = `(function(){if(!window.GM){const p='gm_';window.GM={getValue:(k,d)=>{try{const v=localStorage.getItem(p+k);return v!==null?JSON.parse(v):d}catch(e){return d}},setValue:(k,v)=>{try{localStorage.setItem(p+k,JSON.stringify(v));return Promise.resolve()}catch(e){return Promise.reject(e)}},deleteValue:(k)=>{try{localStorage.removeItem(p+k);return Promise.resolve()}catch(e){return Promise.reject(e)}},listValues:()=>{try{const k=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&key.startsWith(p))k.push(key.substring(p.length))}return Promise.resolve(k)}catch(e){return Promise.reject(e)}},xmlHttpRequest:(d)=>new Promise((res,rej)=>{const x=new XMLHttpRequest();x.open(d.method||'GET',d.url);if(d.headers)Object.keys(d.headers).forEach(k=>x.setRequestHeader(k,d.headers[k]));x.onload=()=>{const r={status:x.status,statusText:x.statusText,responseText:x.responseText,responseHeaders:x.getAllResponseHeaders()};if(d.onload)d.onload(r);res(r)};x.onerror=()=>{if(d.onerror)d.onerror(x);rej(x)};x.send(d.data)}),info:{script:{name:'Userscript'},scriptHandler:'Electron',version:'1.0'}};window.GM_getValue=GM.getValue;window.GM_setValue=(k,v)=>GM.setValue(k,v);window.GM_deleteValue=(k)=>GM.deleteValue(k);window.GM_listValues=GM.listValues;window.GM_xmlhttpRequest=GM.xmlHttpRequest;window.GM_info=GM.info;window.unsafeWindow=window}})();`;
    
    const scriptsByTiming = { 'document-start': [], 'document-body': [], 'document-end': [], 'document-idle': [] };
    scriptsWithMetadata.forEach(s => scriptsByTiming[s.metadata.runAt].push(s));
    
    const inject = (scripts) => scripts.forEach(s => { injectScript(gmApi); injectScript(s.content); });
    
    if (scriptsByTiming['document-start'].length > 0) {
      const waitAndInject = () => {
        if (document.documentElement && document.head) {
          // Wait a bit more to ensure DOM is more ready
          setTimeout(() => inject(scriptsByTiming['document-start']), 10);
        } else {
          const obs = new MutationObserver(() => {
            if (document.documentElement && document.head) {
              obs.disconnect();
              setTimeout(() => inject(scriptsByTiming['document-start']), 10);
            }
          });
          obs.observe(document, { childList: true, subtree: true });
        }
      };
      waitAndInject();
    }
    
    if (scriptsByTiming['document-body'].length > 0) {
      const check = setInterval(() => {
        if (document.body) {
          clearInterval(check);
          inject(scriptsByTiming['document-body']);
        }
      }, 10);
    }
    
    if (scriptsByTiming['document-end'].length > 0) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => inject(scriptsByTiming['document-end']));
      } else {
        inject(scriptsByTiming['document-end']);
      }
    }
    
    if (scriptsByTiming['document-idle'].length > 0) {
      if (document.readyState === 'complete') {
        setTimeout(() => inject(scriptsByTiming['document-idle']), 0);
      } else {
        window.addEventListener('load', () => setTimeout(() => inject(scriptsByTiming['document-idle']), 0));
      }
    }
    
  } catch (error) {
    console.error('Failed to load script:', error);
  }
} else {
  console.log('No script path provided');
}

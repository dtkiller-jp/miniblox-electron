// Application state management
const appState = {
  games: [],
  profiles: {}, // Structure: { gameId: { profileId: { name, locked, scripts } } }
  currentGame: null,
  currentProfile: 'default',
  viewingProfile: null // Profile being viewed in detail
};

// Initialize
async function init() {
  await loadConfig();
  renderGames();
  renderProfiles();
  updateProfileSelect();
  updateGameTitle();
  setupEventListeners();
}

// Load configuration
async function loadConfig() {
  try {
    const config = await window.electronAPI.getConfig();
    appState.games = config.games || getDefaultGames();
    appState.profiles = config.profiles || getDefaultProfiles();
    appState.currentGame = appState.games[0]?.id || 'miniblox';
  } catch (error) {
    console.error('Failed to load config:', error);
    appState.games = getDefaultGames();
    appState.profiles = getDefaultProfiles();
    appState.currentGame = 'miniblox';
  }
}

// Default games
function getDefaultGames() {
  return [
    { id: 'miniblox', name: 'Miniblox', url: 'https://miniblox.io' },
    { id: 'bloxd', name: 'Bloxd', url: 'https://bloxd.io' }
  ];
}

// Default profiles
function getDefaultProfiles() {
  const profiles = {};
  const games = getDefaultGames();
  
  // Create default profile for each game
  games.forEach(game => {
    profiles[game.id] = {
      default: {
        name: 'default',
        locked: true,
        scripts: []
      }
    };
  });
  
  return profiles;
}

// Save configuration
async function saveConfig() {
  try {
    await window.electronAPI.saveConfig({
      games: appState.games,
      profiles: appState.profiles
    });
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

// Render game list
function renderGames() {
  const gameList = document.getElementById('game-list');
  gameList.innerHTML = '';
  
  appState.games.forEach(game => {
    const container = document.createElement('div');
    container.style.position = 'relative';
    
    const btn = document.createElement('button');
    btn.className = 'game-btn';
    btn.textContent = game.name;
    if (game.id === appState.currentGame) {
      btn.classList.add('active');
    }
    btn.onclick = () => selectGame(game.id);
    
    // Add delete button (only for non-default games or if there are more than 1 game)
    if (appState.games.length > 1) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'game-delete-btn';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = 'Delete game';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteGame(game.id);
      };
      container.appendChild(deleteBtn);
    }
    
    container.appendChild(btn);
    gameList.appendChild(container);
  });
}

// Delete game
async function deleteGame(gameId) {
  const game = appState.games.find(g => g.id === gameId);
  
  if (!game) return;
  
  if (!confirm(`Are you sure you want to delete "${game.name}"?\nAll associated profiles will also be deleted.`)) {
    return;
  }
  
  try {
    const result = await window.electronAPI.deleteGame(gameId);
    
    if (result.success) {
      // Update local state
      appState.games = appState.games.filter(g => g.id !== gameId);
      delete appState.profiles[gameId];
      
      // If deleted game was selected, switch to first available game
      if (appState.currentGame === gameId) {
        appState.currentGame = appState.games[0]?.id || null;
        appState.currentProfile = 'default';
      }
      
      renderGames();
      renderProfiles();
      updateProfileSelect();
      updateGameTitle();
    } else {
      alert(result.error || 'Failed to delete game');
    }
  } catch (error) {
    alert('Delete error: ' + error.message);
  }
}

// Select game
function selectGame(gameId) {
  appState.currentGame = gameId;
  appState.currentProfile = 'default';
  renderGames();
  renderProfiles();
  updateProfileSelect();
  updateGameTitle();
  backToProfileList();
}

// Update game title
function updateGameTitle() {
  const game = appState.games.find(g => g.id === appState.currentGame);
  document.getElementById('current-game-title').textContent = game?.name || 'Game';
}

// Get current game profiles
function getCurrentGameProfiles() {
  if (!appState.profiles[appState.currentGame]) {
    appState.profiles[appState.currentGame] = {
      default: {
        name: 'default',
        locked: true,
        scripts: []
      }
    };
  }
  return appState.profiles[appState.currentGame];
}

// Render profile list
function renderProfiles() {
  const profileList = document.getElementById('profile-list');
  profileList.innerHTML = '';
  
  const gameProfiles = getCurrentGameProfiles();
  
  Object.keys(gameProfiles).forEach(profileId => {
    const profile = gameProfiles[profileId];
    const item = document.createElement('div');
    item.className = 'profile-item';
    
    const leftDiv = document.createElement('div');
    leftDiv.className = 'profile-item-left';
    leftDiv.onclick = () => viewProfileDetail(profileId);
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'profile-item-name';
    nameDiv.textContent = profile.name;
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'profile-item-info';
    const scriptCount = profile.scripts?.length || 0;
    infoDiv.textContent = `${scriptCount} script${scriptCount !== 1 ? 's' : ''}`;
    
    leftDiv.appendChild(nameDiv);
    leftDiv.appendChild(infoDiv);
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'profile-item-actions';
    
    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-small';
    exportBtn.textContent = 'Export';
    exportBtn.onclick = (e) => {
      e.stopPropagation();
      exportProfile(profileId);
    };
    actionsDiv.appendChild(exportBtn);
    
    if (!profile.locked) {
      const renameBtn = document.createElement('button');
      renameBtn.className = 'btn btn-small';
      renameBtn.textContent = 'Rename';
      renameBtn.onclick = (e) => {
        e.stopPropagation();
        renameProfileFromList(profileId);
      };
      actionsDiv.appendChild(renameBtn);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-small';
      deleteBtn.textContent = 'Delete';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteProfileFromList(profileId);
      };
      actionsDiv.appendChild(deleteBtn);
    }
    
    item.appendChild(leftDiv);
    item.appendChild(actionsDiv);
    profileList.appendChild(item);
  });
}

// Export profile
async function exportProfile(profileId) {
  try {
    const result = await window.electronAPI.exportProfile(appState.currentGame, profileId);
    
    if (result.success) {
      // Create a download link
      const blob = new Blob([result.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profile-${profileId}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert(result.error || 'Failed to export profile');
    }
  } catch (error) {
    alert('Export error: ' + error.message);
  }
}

// View profile detail
function viewProfileDetail(profileId) {
  appState.viewingProfile = profileId;
  const gameProfiles = getCurrentGameProfiles();
  const profile = gameProfiles[profileId];
  
  // Update profile name display
  document.getElementById('current-profile-name').textContent = profile.name;
  
  // Switch views
  document.getElementById('profile-list-view').style.display = 'none';
  document.getElementById('profile-detail-view').style.display = 'block';
  
  // Render userscripts for this profile
  renderUserscripts();
}

// Back to profile list
function backToProfileList() {
  appState.viewingProfile = null;
  document.getElementById('profile-list-view').style.display = 'block';
  document.getElementById('profile-detail-view').style.display = 'none';
}

// Select profile (for launching)
function selectProfile(profileId) {
  appState.currentProfile = profileId;
  updateProfileSelect();
}

// Update profile select
function updateProfileSelect() {
  const select = document.getElementById('profile-select');
  select.innerHTML = '';
  
  const gameProfiles = getCurrentGameProfiles();
  
  Object.keys(gameProfiles).forEach(profileId => {
    const profile = gameProfiles[profileId];
    const option = document.createElement('option');
    option.value = profileId;
    option.textContent = profile.name;
    select.appendChild(option);
  });
  
  select.value = appState.currentProfile;
}

// Render userscript list
function renderUserscripts() {
  const scriptList = document.getElementById('userscript-list');
  scriptList.innerHTML = '';
  
  if (!appState.viewingProfile) {
    scriptList.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">プロファイルを選択してスクリプトを表示</div>';
    return;
  }
  
  const gameProfiles = getCurrentGameProfiles();
  const profile = gameProfiles[appState.viewingProfile];
  
  if (!profile || !profile.scripts || profile.scripts.length === 0) {
    scriptList.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">スクリプトがありません</div>';
    return;
  }
  
  profile.scripts.forEach((script, index) => {
    const item = document.createElement('div');
    item.className = 'userscript-item';
    
    const name = document.createElement('div');
    name.className = 'userscript-name';
    name.textContent = script.name || `スクリプト ${index + 1}`;
    
    const actions = document.createElement('div');
    actions.className = 'userscript-actions';
    
    if (script.updateUrl) {
      const updateBtn = document.createElement('button');
      updateBtn.className = 'btn btn-small';
      updateBtn.textContent = '更新';
      updateBtn.onclick = () => updateScript(index);
      actions.appendChild(updateBtn);
    }
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-small';
    editBtn.textContent = '編集';
    editBtn.onclick = () => editScript(index);
    actions.appendChild(editBtn);
    
    const renameBtn = document.createElement('button');
    renameBtn.className = 'btn btn-small';
    renameBtn.textContent = '名前変更';
    renameBtn.onclick = () => renameScript(index);
    actions.appendChild(renameBtn);
    
    if (!profile.locked) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-small';
      deleteBtn.textContent = '削除';
      deleteBtn.onclick = () => deleteScript(index);
      actions.appendChild(deleteBtn);
    }
    
    item.appendChild(name);
    item.appendChild(actions);
    scriptList.appendChild(item);
  });
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${tabName}-panel`).classList.add('active');
      
      // Reset to profile list view when switching to profile tab
      if (tabName === 'profile') {
        backToProfileList();
      }
    });
  });
  
  // Profile select
  document.getElementById('profile-select').addEventListener('change', (e) => {
    selectProfile(e.target.value);
  });
  
  // Launch button
  document.getElementById('launch-btn').addEventListener('click', launchGame);
  
  // Add game
  document.getElementById('add-game-btn').addEventListener('click', addGame);
  
  // Settings
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  
  // Add profile
  document.getElementById('add-profile-btn').addEventListener('click', addProfile);
  
  // Import profile
  document.getElementById('import-profile-btn').addEventListener('click', importProfile);
  
  // Back to profiles
  document.getElementById('back-to-profiles-btn').addEventListener('click', backToProfileList);
  
  // Add script
  document.getElementById('add-script-btn').addEventListener('click', addScript);
  
  // Import script from URL
  document.getElementById('import-script-url-btn').addEventListener('click', importScriptFromUrl);
  
  // Modal
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
}

// Launch game
async function launchGame() {
  const game = appState.games.find(g => g.id === appState.currentGame);
  const gameProfiles = getCurrentGameProfiles();
  const profile = gameProfiles[appState.currentProfile];
  
  if (!game || !profile) {
    alert('Game or profile not selected');
    return;
  }
  
  try {
    const result = await window.electronAPI.launchGame({
      gameUrl: game.url,
      gameName: game.name,
      scripts: profile.scripts || []
    });
    
    if (!result.success) {
      alert(result.error || 'Failed to launch game');
    }
  } catch (error) {
    alert('Launch error: ' + error.message);
  }
}

// Show modal
function showModal(title, bodyHtml, onConfirm) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal').classList.add('active');
  
  const confirmBtn = document.getElementById('modal-confirm');
  confirmBtn.onclick = () => {
    onConfirm();
    closeModal();
  };
}

// Close modal
function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

// Add game
function addGame() {
  showModal('Add Game', `
    <div class="form-group">
      <label class="form-label">Game Name</label>
      <input type="text" class="form-input" id="game-name" placeholder="e.g. Bloxd">
    </div>
    <div class="form-group">
      <label class="form-label">URL</label>
      <input type="text" class="form-input" id="game-url" placeholder="e.g. https://bloxd.io">
    </div>
  `, () => {
    const name = document.getElementById('game-name').value.trim();
    const url = document.getElementById('game-url').value.trim();
    
    if (!name || !url) {
      alert('Please fill in all fields');
      return;
    }
    
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Check for duplicate ID
    if (appState.games.find(g => g.id === id)) {
      alert('A game with this ID already exists');
      return;
    }
    
    appState.games.push({ id, name, url });
    
    // Create default profile for new game
    appState.profiles[id] = {
      default: {
        name: 'default',
        locked: true,
        scripts: []
      }
    };
    
    saveConfig();
    renderGames();
  });
}

// Rename profile from list
function renameProfileFromList(profileId) {
  const gameProfiles = getCurrentGameProfiles();
  const profile = gameProfiles[profileId];
  
  if (profile.locked) {
    alert('このプロファイルは名前を変更できません');
    return;
  }
  
  showModal('プロファイル名を変更', `
    <div class="form-group">
      <label class="form-label">新しい名前</label>
      <input type="text" class="form-input" id="profile-name" value="${profile.name}">
    </div>
  `, () => {
    const name = document.getElementById('profile-name').value.trim();
    
    if (!name) {
      alert('名前を入力してください');
      return;
    }
    
    profile.name = name;
    saveConfig();
    renderProfiles();
    updateProfileSelect();
  });
}

// Delete profile from list
function deleteProfileFromList(profileId) {
  const gameProfiles = getCurrentGameProfiles();
  const profile = gameProfiles[profileId];
  
  if (profile.locked) {
    alert('このプロファイルは削除できません');
    return;
  }
  
  if (!confirm(`プロファイル "${profile.name}" を削除してもよろしいですか？`)) {
    return;
  }
  
  delete gameProfiles[profileId];
  
  // If deleted profile was selected, switch to default
  if (appState.currentProfile === profileId) {
    appState.currentProfile = 'default';
  }
  
  saveConfig();
  renderProfiles();
  updateProfileSelect();
}

// Add profile
function addProfile() {
  showModal('Add Profile', `
    <div class="form-group">
      <label class="form-label">Profile Name</label>
      <input type="text" class="form-input" id="profile-name" placeholder="e.g. My Profile">
    </div>
  `, () => {
    const name = document.getElementById('profile-name').value.trim();
    
    if (!name) {
      alert('Please enter a profile name');
      return;
    }
    
    const gameProfiles = getCurrentGameProfiles();
    const id = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    gameProfiles[id] = {
      name,
      locked: false,
      scripts: []
    };
    
    saveConfig();
    renderProfiles();
    updateProfileSelect();
  });
}

// Rename profile
function renameProfile() {
  if (!appState.viewingProfile) return;
  
  const gameProfiles = getCurrentGameProfiles();
  const profile = gameProfiles[appState.viewingProfile];
  
  if (profile.locked) {
    alert('This profile cannot be renamed');
    return;
  }
  
  showModal('Rename Profile', `
    <div class="form-group">
      <label class="form-label">New Name</label>
      <input type="text" class="form-input" id="profile-name" value="${profile.name}">
    </div>
  `, () => {
    const name = document.getElementById('profile-name').value.trim();
    
    if (!name) {
      alert('Please enter a name');
      return;
    }
    
    profile.name = name;
    saveConfig();
    renderProfiles();
    updateProfileSelect();
    document.getElementById('current-profile-name').textContent = name;
  });
}

// Delete profile
function deleteProfile() {
  if (!appState.viewingProfile) return;
  
  const gameProfiles = getCurrentGameProfiles();
  const profile = gameProfiles[appState.viewingProfile];
  
  if (profile.locked) {
    alert('This profile cannot be deleted');
    return;
  }
  
  if (!confirm(`Are you sure you want to delete profile "${profile.name}"?`)) {
    return;
  }
  
  delete gameProfiles[appState.viewingProfile];
  
  // If deleted profile was selected, switch to default
  if (appState.currentProfile === appState.viewingProfile) {
    appState.currentProfile = 'default';
  }
  
  saveConfig();
  renderProfiles();
  updateProfileSelect();
  backToProfileList();
}

// Parse userscript metadata
function parseScriptMetadata(code) {
  const metadata = {
    name: 'Unnamed Script',
    version: '1.0',
    description: '',
    updateUrl: null
  };
  
  const metaBlock = code.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
  if (metaBlock) {
    const metaContent = metaBlock[1];
    
    const nameMatch = metaContent.match(/\/\/ @name\s+(.+)/);
    if (nameMatch) metadata.name = nameMatch[1].trim();
    
    const versionMatch = metaContent.match(/\/\/ @version\s+(.+)/);
    if (versionMatch) metadata.version = versionMatch[1].trim();
    
    const descMatch = metaContent.match(/\/\/ @description\s+(.+)/);
    if (descMatch) metadata.description = descMatch[1].trim();
    
    const updateMatch = metaContent.match(/\/\/ @updateURL\s+(.+)/);
    if (updateMatch) metadata.updateUrl = updateMatch[1].trim();
  }
  
  return metadata;
}

// Add script
function addScript() {
  if (!appState.viewingProfile) {
    alert('最初にプロファイルを選択してください');
    return;
  }
  
  const gameProfiles = getCurrentGameProfiles();
  const profile = gameProfiles[appState.viewingProfile];
  
  if (profile.locked) {
    alert('このプロファイルは編集できません');
    return;
  }
  
  showModal('スクリプトを追加', `
    <div class="form-group">
      <label class="form-label">スクリプトコード</label>
      <textarea class="form-textarea" id="script-code" placeholder="// ==UserScript==&#10;// @name         マイスクリプト&#10;// @version      1.0&#10;// @description  スクリプトの説明&#10;// @updateURL    https://example.com/script.js&#10;// ==/UserScript==&#10;&#10;console.log('Hello');"></textarea>
    </div>
  `, () => {
    const code = document.getElementById('script-code').value.trim();
    
    if (!code) {
      alert('スクリプトコードを入力してください');
      return;
    }
    
    const metadata = parseScriptMetadata(code);
    profile.scripts.push({ 
      name: metadata.name,
      code: code,
      updateUrl: metadata.updateUrl
    });
    saveConfig();
    renderUserscripts();
    renderProfiles();
  });
}

// Import script from URL
function importScriptFromUrl() {
  if (!appState.viewingProfile) {
    alert('最初にプロファイルを選択してください');
    return;
  }
  
  const gameProfiles = getCurrentGameProfiles();
  const profile = gameProfiles[appState.viewingProfile];
  
  if (profile.locked) {
    alert('このプロファイルは編集できません');
    return;
  }
  
  showModal('URLからスクリプトをインポート', `
    <div class="form-group">
      <label class="form-label">スクリプトURL</label>
      <input type="text" class="form-input" id="script-url" placeholder="https://example.com/script.js">
    </div>
  `, async () => {
    const url = document.getElementById('script-url').value.trim();
    
    if (!url) {
      alert('URLを入力してください');
      return;
    }
    
    try {
      const script = await window.electronAPI.fetchScript(url);
      const metadata = parseScriptMetadata(script.code);
      profile.scripts.push({
        name: metadata.name,
        code: script.code,
        updateUrl: metadata.updateUrl || url
      });
      saveConfig();
      renderUserscripts();
      renderProfiles();
    } catch (error) {
      alert('スクリプトの取得に失敗しました: ' + error.message);
    }
  });
}

// Edit script
function editScript(index) {
  if (!appState.viewingProfile) return;
  
  const gameProfiles = getCurrentGameProfiles();
  const profile = gameProfiles[appState.viewingProfile];
  const script = profile.scripts[index];
  
  showModal('Edit Script', `
    <div class="form-group">
      <label class="form-label">Script Code</label>
      <textarea class="form-textarea" id="script-code">${script.code}</textarea>
    </div>
  `, () => {
    const code = document.getElementById('script-code').value.trim();
    
    if (!code) {
      alert('Please enter script code');
      return;
    }
    
    const metadata = parseScriptMetadata(code);
    script.name = metadata.name;
    script.code = code;
    script.updateUrl = metadata.updateUrl;
    saveConfig();
    renderUserscripts();
    renderProfiles();
  });
}

// Rename script
function renameScript(index) {
  if (!appState.viewingProfile) return;
  
  const gameProfiles = getCurrentGameProfiles();
  const profile = gameProfiles[appState.viewingProfile];
  const script = profile.scripts[index];
  
  showModal('Rename Script', `
    <div class="form-group">
      <label class="form-label">New Name</label>
      <input type="text" class="form-input" id="script-name" value="${script.name}">
    </div>
  `, () => {
    const name = document.getElementById('script-name').value.trim();
    
    if (!name) {
      alert('Please enter a name');
      return;
    }
    
    script.name = name;
    saveConfig();
    renderUserscripts();
    renderProfiles();
  });
}

// Delete script
function deleteScript(index) {
  if (!appState.viewingProfile) return;
  
  if (!confirm('Are you sure you want to delete this script?')) {
    return;
  }
  
  const gameProfiles = getCurrentGameProfiles();
  const profile = gameProfiles[appState.viewingProfile];
  profile.scripts.splice(index, 1);
  saveConfig();
  renderUserscripts();
  renderProfiles();
}

// Update script
async function updateScript(index) {
  if (!appState.viewingProfile) return;
  
  const gameProfiles = getCurrentGameProfiles();
  const profile = gameProfiles[appState.viewingProfile];
  const script = profile.scripts[index];
  
  if (!script.updateUrl) {
    alert('Update URL not configured');
    return;
  }
  
  try {
    const updated = await window.electronAPI.fetchScript(script.updateUrl);
    const metadata = parseScriptMetadata(updated.code);
    script.code = updated.code;
    script.name = metadata.name;
    script.updateUrl = metadata.updateUrl || script.updateUrl;
    saveConfig();
    renderUserscripts();
    renderProfiles();
    alert('Script updated successfully');
  } catch (error) {
    alert('Failed to update: ' + error.message);
  }
}

// Import profile
function importProfile() {
  showModal('Import Profile', `
    <div class="form-group">
      <label class="form-label">JSON URL or File Path</label>
      <input type="text" class="form-input" id="profile-source" placeholder="https://example.com/profile.json">
    </div>
  `, async () => {
    const source = document.getElementById('profile-source').value.trim();
    
    if (!source) {
      alert('Please enter a URL or path');
      return;
    }
    
    try {
      const profileData = await window.electronAPI.importProfile(source);
      const gameProfiles = getCurrentGameProfiles();
      const id = Date.now().toString();
      gameProfiles[id] = profileData;
      saveConfig();
      renderProfiles();
      updateProfileSelect();
      alert('Profile imported successfully');
    } catch (error) {
      alert('Failed to import: ' + error.message);
    }
  });
}

// Settings
function openSettings() {
  alert('Settings feature coming soon');
}

// Initialize
init();

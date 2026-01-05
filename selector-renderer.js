// Store versions data
let versionsData = null;

// Load versions from main process
async function loadVersions() {
  try {
    versionsData = await window.electronAPI.getVersions();
    const select = document.getElementById('version-select');
    select.innerHTML = '';
    
    versionsData.versions.forEach((version, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = version.name;
      select.appendChild(option);
    });
    
    if (versionsData.versions.length > 0) {
      select.selectedIndex = 0;
    }
  } catch (error) {
    showStatus('Failed to load versions', 'error');
  }
}

// Show status message
function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  
  if (type === 'success') {
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }
}

// Launch button handler
document.getElementById('launch-btn').addEventListener('click', async () => {
  const select = document.getElementById('version-select');
  const selectedIndex = select.value;
  
  if (selectedIndex === '' || !versionsData) {
    showStatus('Please select a version', 'error');
    return;
  }
  
  const selectedVersion = versionsData.versions[selectedIndex];
  
  try {
    await window.electronAPI.launchApp(selectedVersion);
  } catch (error) {
    showStatus('Failed to launch', 'error');
  }
});

// Initialize
loadVersions();

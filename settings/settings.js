/**
 * Settings page script — loads/saves settings from chrome.storage.sync
 */

const DEFAULT_SETTINGS = {
  delay: 15,
  subfolder: 'screenshots',
  format: 'png',
  quality: 85,
  captureMode: 'fullpage',
  closeTab: true,
  pageWait: 3,
  saveLocation: 'downloads',
};

// --- DOM ---
const form = document.getElementById('settings-form');
const delayInput = document.getElementById('delay');
const subfolderInput = document.getElementById('subfolder');
const formatSelect = document.getElementById('format');
const qualityField = document.getElementById('quality-field');
const qualityInput = document.getElementById('quality');
const qualityValue = document.getElementById('quality-value');
const closeTabInput = document.getElementById('close-tab');
const pageWaitInput = document.getElementById('page-wait');
const saveStatus = document.getElementById('save-status');

// Save Location elements
const customFolderField = document.getElementById('custom-folder-field');
const selectFolderBtn = document.getElementById('select-folder-btn');
const folderNameDisplay = document.getElementById('folder-name-display');

// --- Load settings ---
document.addEventListener('DOMContentLoaded', async () => {
  const { settings = DEFAULT_SETTINGS } = await chrome.storage.sync.get('settings');

  delayInput.value = settings.delay ?? DEFAULT_SETTINGS.delay;
  subfolderInput.value = settings.subfolder ?? DEFAULT_SETTINGS.subfolder;
  formatSelect.value = settings.format ?? DEFAULT_SETTINGS.format;
  qualityInput.value = settings.quality ?? DEFAULT_SETTINGS.quality;
  qualityValue.textContent = `${qualityInput.value}%`;
  closeTabInput.checked = settings.closeTab ?? DEFAULT_SETTINGS.closeTab;
  pageWaitInput.value = settings.pageWait ?? DEFAULT_SETTINGS.pageWait;

  // Set capture mode radio
  const modeRadio = document.querySelector(
    `input[name="captureMode"][value="${settings.captureMode ?? DEFAULT_SETTINGS.captureMode}"]`
  );
  if (modeRadio) modeRadio.checked = true;

  // Set save location radio
  const locationRadio = document.querySelector(
    `input[name="saveLocation"][value="${settings.saveLocation ?? DEFAULT_SETTINGS.saveLocation}"]`
  );
  if (locationRadio) locationRadio.checked = true;

  // Show/hide fields
  toggleQualityField();
  toggleCustomFolderField();

  // Load custom folder handle
  const handle = await loadDirectoryHandle();
  if (handle) {
    folderNameDisplay.textContent = handle.name;
  } else {
    folderNameDisplay.textContent = 'No folder selected';
  }
});

// --- Save Location change: show/hide custom folder field ---
document.querySelectorAll('input[name="saveLocation"]').forEach(radio => {
  radio.addEventListener('change', toggleCustomFolderField);
});

function toggleCustomFolderField() {
  const isCustom = document.querySelector('input[name="saveLocation"]:checked')?.value === 'custom';
  customFolderField.style.display = isCustom ? 'flex' : 'none';
}

// --- Folder picker ---
selectFolderBtn.addEventListener('click', async () => {
  try {
    const handle = await window.showDirectoryPicker();
    await saveDirectoryHandle(handle);
    folderNameDisplay.textContent = handle.name;
  } catch (err) {
    console.error('Directory selection cancelled or failed:', err);
  }
});

// --- Format change: show/hide quality ---
formatSelect.addEventListener('change', toggleQualityField);

function toggleQualityField() {
  qualityField.style.display = formatSelect.value === 'jpeg' ? 'flex' : 'none';
}

// --- Quality slider value display ---
qualityInput.addEventListener('input', () => {
  qualityValue.textContent = `${qualityInput.value}%`;
});

// --- Sidebar navigation (tab switching) ---
document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.nav-item[data-section]');
  const sections = document.querySelectorAll('.settings-section');

  function activateTab(sectionId) {
    // Update nav
    navItems.forEach(n => n.classList.toggle('active', n.dataset.section === sectionId));
    // Show/hide sections
    sections.forEach(s => s.classList.toggle('active', s.id === sectionId));
  }

  // Set first tab active on load
  if (navItems.length) activateTab(navItems[0].dataset.section);

  // Click handler
  navItems.forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      activateTab(item.dataset.section);
    });
  });
});

// --- Back to Dashboard navigation ---
const backDashboardBtn = document.getElementById('back-dashboard-btn');
if (backDashboardBtn) {
  backDashboardBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const url = chrome.runtime.getURL('popup/popup.html');
    try {
      const tabs = await chrome.tabs.query({ url });
      if (tabs.length > 0) {
        await chrome.tabs.update(tabs[0].id, { active: true });
        await chrome.windows.update(tabs[0].windowId, { drawAttention: true, focused: true });
      } else {
        await chrome.tabs.create({ url });
      }
    } catch {
      window.location.href = url;
    }
  });
}

// --- Save ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const captureModeRadio = document.querySelector('input[name="captureMode"]:checked');
  const saveLocationRadio = document.querySelector('input[name="saveLocation"]:checked');

  // Verify custom folder if custom save is checked
  if (saveLocationRadio?.value === 'custom') {
    const handle = await loadDirectoryHandle();
    if (!handle) {
      alert('Please select a custom folder before saving settings.');
      return;
    }
  }

  const settings = {
    delay: Math.max(1, Math.min(120, parseInt(delayInput.value, 10) || DEFAULT_SETTINGS.delay)),
    subfolder: subfolderInput.value.trim() || DEFAULT_SETTINGS.subfolder,
    format: formatSelect.value,
    quality: parseInt(qualityInput.value, 10) || DEFAULT_SETTINGS.quality,
    captureMode: captureModeRadio ? captureModeRadio.value : DEFAULT_SETTINGS.captureMode,
    saveLocation: saveLocationRadio ? saveLocationRadio.value : DEFAULT_SETTINGS.saveLocation,
    closeTab: closeTabInput.checked,
    pageWait: Math.max(0, Math.min(30, parseInt(pageWaitInput.value, 10) || DEFAULT_SETTINGS.pageWait)),
  };

  await chrome.storage.sync.set({ settings });

  // Show save confirmation
  saveStatus.textContent = '✓ Settings saved';
  saveStatus.classList.add('visible');
  setTimeout(() => {
    saveStatus.classList.remove('visible');
  }, 2000);
});

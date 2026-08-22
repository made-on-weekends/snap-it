/**
 * Menu script for SnapIt extension action popup.
 * Handles quick actions: Full Page screenshot, Viewport screenshot, and Batch Screenshots.
 */

const optFullpage = document.getElementById('opt-fullpage');
const optViewport = document.getElementById('opt-viewport');
const optBatch = document.getElementById('opt-batch');
const optAnnotate = document.getElementById('opt-annotate');
const menuFileInput = document.getElementById('menu-file-input');
const menuSettingsBtn = document.getElementById('menu-settings-btn');
const menuStatus = document.getElementById('menu-status');
const menuStatusText = document.getElementById('menu-status-text');

function showLoading(text) {
  menuStatusText.textContent = text;
  menuStatus.classList.remove('hidden');
}

function hideLoading() {
  menuStatus.classList.add('hidden');
}

function isSupportedUrl(url) {
  if (!url) return false;
  return !url.startsWith('chrome://') && !url.startsWith('chrome-extension://') && !url.startsWith('about:') && !url.startsWith('edge://');
}

async function openOrFocusDashboard(queryParam = '') {
  const baseUrl = chrome.runtime.getURL('popup/popup.html');
  const targetUrl = queryParam ? `${baseUrl}${queryParam}` : baseUrl;

  try {
    const tabs = await chrome.tabs.query({ url: `${baseUrl}*` });
    if (tabs.length > 0) {
      await chrome.tabs.update(tabs[0].id, { url: targetUrl, active: true });
      await chrome.windows.update(tabs[0].windowId, { drawAttention: true, focused: true });
    } else {
      await chrome.tabs.create({ url: targetUrl });
    }
  } catch {
    await chrome.tabs.create({ url: targetUrl });
  }
  window.close();
}

async function getActiveWebTab() {
  let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || tabs.length === 0) {
    tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  }
  return tabs && tabs.length > 0 ? tabs[0] : null;
}

async function captureActiveTab(captureMode) {
  showLoading(captureMode === 'fullpage' ? 'Capturing Full Page...' : 'Capturing Viewport...');

  try {
    const activeTab = await getActiveWebTab();
    if (!activeTab || !activeTab.id) {
      throw new Error('No active web page detected.');
    }

    if (!isSupportedUrl(activeTab.url)) {
      throw new Error('Cannot capture internal browser pages. Switch to a standard website (e.g. https://google.com) and try again.');
    }

    const response = await chrome.runtime.sendMessage({
      type: 'CAPTURE_SINGLE',
      options: {
        target: 'tab',
        tabId: activeTab.id,
        captureMode,
        save: true,
      },
    });

    if (response && response.error) {
      throw new Error(response.error);
    }

    if (response && response.result) {
      // Save pending result to storage so dashboard tab can auto-load it
      await chrome.storage.local.set({
        lastCapturedResult: response.result,
      });

      // Open dashboard in single mode showing the capture preview
      await openOrFocusDashboard('?mode=single&captured=1');
    } else {
      throw new Error('Screenshot capture returned empty result.');
    }
  } catch (err) {
    showLoading(`Error: ${err.message}`);
    setTimeout(() => {
      hideLoading();
    }, 4000);
  }
}

async function openSettings() {
  const url = chrome.runtime.getURL('settings/settings.html');
  try {
    const tabs = await chrome.tabs.query({ url });
    if (tabs.length > 0) {
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId, { drawAttention: true, focused: true });
    } else {
      await chrome.tabs.create({ url });
    }
  } catch {
    chrome.runtime.openOptionsPage();
  }
  window.close();
}

// Event Handlers
if (optFullpage) optFullpage.addEventListener('click', () => captureActiveTab('fullpage'));
if (optViewport) optViewport.addEventListener('click', () => captureActiveTab('viewport'));
if (optBatch) optBatch.addEventListener('click', () => openOrFocusDashboard('?mode=batch'));

if (optAnnotate) {
  optAnnotate.addEventListener('click', () => {
    openOrFocusDashboard('?mode=annotate');
  });
}

if (menuFileInput) {
  menuFileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showLoading('Opening image...');
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        await chrome.storage.local.set({
          lastCapturedResult: {
            dataUrl,
            filename: file.name,
            url: file.name,
            timestamp: new Date().toISOString(),
            isUploaded: true,
          },
        });
        await openOrFocusDashboard('?mode=annotate&captured=1');
      }
    };
    reader.readAsDataURL(file);
  });
}

if (menuSettingsBtn) menuSettingsBtn.addEventListener('click', openSettings);

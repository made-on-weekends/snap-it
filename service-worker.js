/**
 * Service Worker — orchestrates the mass screenshot capture process.
 *
 * Flow:
 * 1. Receive job list from popup
 * 2. Process URLs one at a time sequentially
 * 3. For each URL: create tab → wait for load → capture screenshot → download → close tab
 * 4. Wait configurable delay between URLs (via chrome.alarms)
 * 5. Report progress via chrome.storage.session
 */

// ========== DEFAULT SETTINGS ==========
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

// ========== EVENT LISTENERS (registered synchronously at top level) ==========

// Handle action click: open in tab
chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL('popup/popup.html');
  try {
    const tabs = await chrome.tabs.query({ url });
    if (tabs.length > 0) {
      // Focus existing tab
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId, { drawAttention: true, focused: true });
    } else {
      // Open new tab
      await chrome.tabs.create({ url });
    }
  } catch (err) {
    console.error('Error opening tab:', err);
    // Fallback simple create
    chrome.tabs.create({ url });
  }
});


importScripts('storage-helper.js');

// In-memory cache for full screenshot data URLs (for instant Annotation Studio loading)
const screenshotCache = new Map();

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_CAPTURE') {
    (async () => {
      try {
        const senderTabId = sender.tab?.id || null;
        await startCapture(message.jobs, senderTabId, message.batchDir);
        sendResponse({ ok: true });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    return true; // keep channel open for async response
  }

  if (message.type === 'STOP_CAPTURE') {
    (async () => {
      await stopCapture();
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message.type === 'GET_SCREENSHOT_DATA') {
    (async () => {
      const filenameBase = message.filename && message.filename.includes('/') ? message.filename.split('/').pop() : null;
      let dataUrl = (message.filename && screenshotCache.get(message.filename)) ||
                    (filenameBase && screenshotCache.get(filenameBase)) ||
                    (message.url && screenshotCache.get(message.url)) || null;
      if (!dataUrl && typeof loadCachedScreenshot === 'function') {
        dataUrl = (await loadCachedScreenshot(message.filename)) ||
                  (filenameBase ? await loadCachedScreenshot(filenameBase) : null) ||
                  (await loadCachedScreenshot(message.url)) || null;
      }
      sendResponse({ ok: true, dataUrl });
    })();
    return true;
  }

  if (message.type === 'GET_OPEN_TABS') {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({});
        const validTabs = tabs
          .filter(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://') || t.url.startsWith('file://')))
          .map(t => ({ id: t.id, title: t.title || t.url, url: t.url, active: t.active, favIconUrl: t.favIconUrl || '' }));
        sendResponse({ ok: true, tabs: validTabs });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'CAPTURE_SINGLE') {
    (async () => {
      try {
        const senderTabId = sender.tab?.id || null;
        const result = await captureSingleScreenshot(message.options || {}, senderTabId);
        sendResponse({ ok: true, result });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    return true;
  }
});

// Handle alarm for delay between captures
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'capture-delay') {
    await processNextJob();
  }
});

// Set defaults and context menus on install
function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'snapit-fullpage',
      title: 'SnapIt: Full Page Screenshot',
      contexts: ['all'],
    });
    chrome.contextMenus.create({
      id: 'snapit-viewport',
      title: 'SnapIt: Visible Only Screenshot',
      contexts: ['all'],
    });
    chrome.contextMenus.create({
      id: 'snapit-batch',
      title: 'SnapIt: Batch Screenshots',
      contexts: ['all'],
    });
    chrome.contextMenus.create({
      id: 'snapit-annotate',
      title: 'SnapIt: Annotation Studio',
      contexts: ['all'],
    });
  });
}

chrome.runtime.onInstalled.addListener(async (details) => {
  setupContextMenus();
  if (details.reason === 'install') {
    const { settings } = await chrome.storage.sync.get('settings');
    if (!settings) {
      await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    }
  }
});

chrome.runtime.onStartup.addListener(() => {
  setupContextMenus();
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'snapit-batch') {
    const url = chrome.runtime.getURL('popup/popup.html?mode=batch');
    chrome.tabs.create({ url });
    return;
  }

  if (info.menuItemId === 'snapit-annotate') {
    const url = chrome.runtime.getURL('popup/popup.html?mode=annotate');
    chrome.tabs.create({ url });
    return;
  }

  if (info.menuItemId === 'snapit-fullpage' || info.menuItemId === 'snapit-viewport') {
    const captureMode = info.menuItemId === 'snapit-fullpage' ? 'fullpage' : 'viewport';
    if (!tab || !tab.id) return;

    try {
      const result = await captureSingleScreenshot({
        target: 'tab',
        tabId: tab.id,
        captureMode,
        save: true,
      });

      if (result && result.dataUrl) {
        await chrome.storage.local.set({ lastCapturedResult: result });
        const dashboardUrl = chrome.runtime.getURL('popup/popup.html?mode=single&captured=1');
        chrome.tabs.create({ url: dashboardUrl });
      }
    } catch (err) {
      console.error('Context menu capture failed:', err);
    }
  }
});

// ========== STATE MANAGEMENT ==========

async function getSettings() {
  const { settings = DEFAULT_SETTINGS } = await chrome.storage.sync.get('settings');
  return { ...DEFAULT_SETTINGS, ...settings };
}

async function getState() {
  const { captureState } = await chrome.storage.session.get('captureState');
  return captureState || null;
}

async function setState(updates) {
  const current = await getState() || {};
  const newState = { ...current, ...updates };
  await chrome.storage.session.set({ captureState: newState });
}

async function appendLog(message, type = 'info') {
  const current = await getState() || {};
  const logHistory = current.logHistory || [];
  const entry = { message, type, ts: Date.now() };
  logHistory.push(entry);

  // Keep last 100 log entries
  if (logHistory.length > 100) {
    logHistory.splice(0, logHistory.length - 100);
  }

  await setState({
    logHistory,
    lastLog: entry,
  });
}

async function isStopped() {
  const state = await getState();
  return state && state.status === 'stopped';
}

// ========== CAPTURE ORCHESTRATION ==========

async function startCapture(jobs, senderTabId = null, batchDir = null) {
  // Check if already running
  const currentState = await getState();
  if (currentState && (currentState.status === 'running' || currentState.status === 'waiting')) {
    throw new Error('A capture is already in progress');
  }

  let finalBatchDir = batchDir;
  if (!finalBatchDir) {
    try {
      const settings = await getSettings();
      finalBatchDir = typeof determineNextBatchDir === 'function'
        ? await determineNextBatchDir(settings)
        : 'batch-01';
    } catch {
      finalBatchDir = 'batch-01';
    }
  }

  // Initialize state
  await setState({
    status: 'running',
    jobs,
    batchDir: finalBatchDir,
    currentIndex: 0,
    completed: 0,
    total: jobs.length,
    currentUrl: jobs[0]?.url || '',
    logHistory: [],
    lastLog: null,
    senderTabId,
    startTime: Date.now(),
    endTime: null,
    results: [],
  });

  await appendLog(`Starting capture of ${jobs.length} URL(s) into [${finalBatchDir}]`, 'info');

  // Begin processing the first job
  await processCurrentJob();
}

async function stopCapture() {
  await setState({ status: 'stopped', currentUrl: '', endTime: Date.now() });
  await appendLog('Capture stopped by user', 'waiting');
  // Cancel any pending alarm
  await chrome.alarms.clear('capture-delay');
}

async function processCurrentJob() {
  const state = await getState();
  if (!state || state.status === 'stopped') return;

  const { jobs, currentIndex } = state;

  if (currentIndex >= jobs.length) {
    // All done
    await setState({ status: 'completed', currentUrl: '', endTime: Date.now() });
    await appendLog(`All ${jobs.length} screenshots captured!`, 'success');
    return;
  }

  const job = jobs[currentIndex];
  await setState({ status: 'running', currentUrl: job.url });
  await appendLog(`[${currentIndex + 1}/${jobs.length}] Capturing: ${job.url}`, 'info');

  try {
    const { filename, thumbnail, dataUrl } = await captureScreenshot(job);
    if (dataUrl) {
      screenshotCache.set(filename, dataUrl);
      if (job.url) screenshotCache.set(job.url, dataUrl);
      if (typeof filename === 'string' && filename.includes('/')) {
        const baseName = filename.split('/').pop();
        if (baseName) screenshotCache.set(baseName, dataUrl);
      }
      if (screenshotCache.size > 50) {
        const firstKey = screenshotCache.keys().next().value;
        screenshotCache.delete(firstKey);
      }
      try {
        await saveCachedScreenshot(filename, dataUrl, job.url);
      } catch (cacheErr) {
        console.warn('Failed to persist screenshot in IndexedDB:', cacheErr);
      }
      // Broadcast to any open extension views (like popup tab)
      try {
        chrome.runtime.sendMessage({
          type: 'CACHE_SCREENSHOT',
          filename,
          url: job.url,
          dataUrl,
        });
      } catch {
        // Ignore if no listeners
      }
    }
    const currentResults = (await getState()).results || [];
    currentResults.push({
      url: job.url,
      name: job.name,
      status: 'success',
      filename: filename,
      thumbnail: thumbnail,
      timestamp: Date.now()
    });
    await setState({
      completed: currentIndex + 1,
      results: currentResults
    });
    await appendLog(`✓ Saved: ${getFilename(job)}`, 'success');
  } catch (err) {
    await appendLog(`✗ Failed: ${job.url} — ${err.message}`, 'error');
    const currentResults = (await getState()).results || [];
    currentResults.push({
      url: job.url,
      name: job.name,
      status: 'failed',
      error: err.message,
      timestamp: Date.now()
    });
    await setState({
      completed: currentIndex + 1,
      results: currentResults
    });
  }

  // Check if stopped during capture
  if (await isStopped()) return;

  // Move to next
  const nextIndex = currentIndex + 1;
  await setState({ currentIndex: nextIndex });

  if (nextIndex >= jobs.length) {
    await setState({ status: 'completed', currentUrl: '', endTime: Date.now() });
    await appendLog(`All ${jobs.length} screenshots captured!`, 'success');
    return;
  }

  // Schedule delay before next capture
  const settings = await getSettings();
  await setState({ status: 'waiting', currentUrl: `Waiting ${settings.delay}s before next...` });
  await appendLog(`Waiting ${settings.delay}s before next URL...`, 'waiting');

  chrome.alarms.create('capture-delay', {
    delayInMinutes: settings.delay / 60,
  });
}

async function processNextJob() {
  if (await isStopped()) return;
  await processCurrentJob();
}

// ========== SCREENSHOT CAPTURE ==========

async function captureScreenshot(job) {
  const settings = await getSettings();
  const state = await getState();
  const batchDir = state?.batchDir || null;
  let tabId = null;

  try {
    // 1. Create a new tab
    const tab = await chrome.tabs.create({ url: job.url, active: false });
    tabId = tab.id;

    // 2. Wait for the page to fully load
    await waitForTabLoad(tabId);

    // 3. Extra wait for dynamic content
    if (settings.pageWait > 0) {
      await sleep(settings.pageWait * 1000);
    }

    // 4. Capture screenshot
    let dataUrl;
    if (settings.captureMode === 'fullpage') {
      dataUrl = await captureFullPage(tabId, settings);
    } else {
      dataUrl = await captureViewport(tabId, settings);
    }

    // 5. Download / Save the screenshot
    const filename = buildFilePath(job, settings, batchDir);
    if (settings.saveLocation === 'custom') {
      await saveCustomScreenshot(dataUrl, filename);
    } else {
      await downloadScreenshot(dataUrl, filename);
    }

    // Generate lightweight thumbnail for results table
    let thumbnail = null;
    try {
      thumbnail = await generateThumbnail(dataUrl, 160, 100);
    } catch (thumbErr) {
      console.warn('Failed to generate thumbnail:', thumbErr);
    }

    // 6. Close the tab (if configured)
    if (settings.closeTab) {
      try {
        await chrome.tabs.remove(tabId);
      } catch {
        // Tab may already be closed
      }
      tabId = null;
    }

    return { filename, thumbnail, dataUrl };
  } catch (err) {
    // Clean up tab on error
    if (tabId && settings.closeTab) {
      try {
        await chrome.tabs.remove(tabId);
      } catch {
        // ignore
      }
    }
    throw err;
  }
}

function isCapturableUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('about:') ||
    url.startsWith('edge://') ||
    url.startsWith('brave://') ||
    url.includes('chrome.google.com/webstore')
  ) {
    return false;
  }
  return true;
}

async function captureSingleScreenshot(options, senderTabId = null) {
  const globalSettings = await getSettings();
  const settings = {
    ...globalSettings,
    ...(options.captureMode ? { captureMode: options.captureMode } : {}),
  };

  let tabId = options.tabId || null;
  let createdTab = false;
  let pageUrl = options.url || '';

  try {
    if (options.target === 'tab' && options.tabId) {
      tabId = options.tabId;
      const tab = await chrome.tabs.get(tabId);
      pageUrl = tab.url;
    } else if (options.target === 'activeTab') {
      const allTabs = await chrome.tabs.query({ lastFocusedWindow: true });
      const candidate = allTabs.find(t => t.id !== senderTabId && t.url && isCapturableUrl(t.url));
      if (candidate) {
        tabId = candidate.id;
        pageUrl = candidate.url;
      } else {
        throw new Error('No open web page tab found in the active window.');
      }
    } else {
      if (!pageUrl) {
        throw new Error('Please enter a valid URL to capture.');
      }
      if (!isCapturableUrl(pageUrl)) {
        throw new Error('Internal browser pages (chrome://, extension pages) cannot be captured.');
      }
      const tab = await chrome.tabs.create({ url: pageUrl, active: false });
      tabId = tab.id;
      createdTab = true;
      await waitForTabLoad(tabId);
      if (settings.pageWait > 0) {
        await sleep(settings.pageWait * 1000);
      }
    }

    if (!isCapturableUrl(pageUrl)) {
      throw new Error(`Cannot capture internal browser pages (${pageUrl}). Please navigate to a standard web page.`);
    }

    // Capture screenshot
    let dataUrl;
    if (settings.captureMode === 'fullpage') {
      dataUrl = await captureFullPage(tabId, settings);
    } else {
      dataUrl = await captureViewport(tabId, settings);
    }

    const job = { url: pageUrl, name: options.name || null };
    const filename = buildFilePath(job, settings);

    if (options.save) {
      if (settings.saveLocation === 'custom') {
        try {
          await saveCustomScreenshot(dataUrl, filename, senderTabId);
        } catch (saveErr) {
          console.warn('Custom folder save via service-worker deferred to controller tab:', saveErr);
          // Do not fall back to default downloads folder when user specifically chose custom directory
        }
      } else {
        await downloadScreenshot(dataUrl, filename);
      }
    }

    if (createdTab && settings.closeTab) {
      try {
        await chrome.tabs.remove(tabId);
      } catch {
        // Tab may already be closed
      }
      tabId = null;
    }

    // Generate lightweight thumbnail
    let thumbnail = null;
    try {
      thumbnail = await generateThumbnail(dataUrl, 160, 100);
    } catch (thumbErr) {
      console.warn('Single capture thumbnail generation failed:', thumbErr);
    }

    return {
      dataUrl,
      thumbnail,
      filename,
      url: pageUrl,
      saved: !!options.save,
      timestamp: Date.now(),
    };
  } catch (err) {
    if (createdTab && tabId && settings.closeTab) {
      try {
        await chrome.tabs.remove(tabId);
      } catch {
        // ignore
      }
    }
    throw err;
  }
}

async function saveCustomScreenshot(dataUrl, filename, directTabId = null) {
  const state = await getState();
  const tabId = directTabId || state?.senderTabId;

  if (tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { type: 'SAVE_CUSTOM_SCREENSHOT', dataUrl, filename }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Failed to save screenshot via tab: ${chrome.runtime.lastError.message}`));
        } else if (response && response.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'SAVE_CUSTOM_SCREENSHOT', dataUrl, filename }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Failed to save screenshot: ${chrome.runtime.lastError.message}`));
        } else if (response && response.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }
}

// ========== FULL PAGE CAPTURE (CDP via chrome.debugger) ==========

async function captureFullPage(tabId, settings) {
  // Attach the debugger
  await chrome.debugger.attach({ tabId }, '1.3');

  try {
    // Get the full page dimensions
    const metrics = await sendDebuggerCommand(tabId, 'Page.getLayoutMetrics');

    const contentWidth = Math.ceil(metrics.contentSize.width);
    const contentHeight = Math.ceil(metrics.contentSize.height);

    // Cap dimensions to prevent memory issues (max 16384px)
    const maxDimension = 16384;
    const width = Math.min(contentWidth, maxDimension);
    const height = Math.min(contentHeight, maxDimension);

    // Override device metrics to full page size
    await sendDebuggerCommand(tabId, 'Emulation.setDeviceMetricsOverride', {
      mobile: false,
      width,
      height,
      deviceScaleFactor: 1,
    });

    // Small delay for reflow
    await sleep(500);

    // Capture the screenshot
    const result = await sendDebuggerCommand(tabId, 'Page.captureScreenshot', {
      format: settings.format === 'jpeg' ? 'jpeg' : 'png',
      quality: settings.format === 'jpeg' ? settings.quality : undefined,
      clip: {
        x: 0,
        y: 0,
        width,
        height,
        scale: 1,
      },
      captureBeyondViewport: true,
    });

    // Reset device metrics
    await sendDebuggerCommand(tabId, 'Emulation.clearDeviceMetricsOverride');

    // Return data URL
    const mimeType = settings.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    return `data:${mimeType};base64,${result.data}`;
  } finally {
    // Always detach the debugger
    try {
      await chrome.debugger.detach({ tabId });
    } catch {
      // May already be detached
    }
  }
}

// ========== VIEWPORT CAPTURE ==========

async function captureViewport(tabId, settings) {
  // Try CDP debugger viewport capture first (works on background tabs & popups)
  let debuggerAttached = false;
  try {
    await chrome.debugger.attach({ tabId }, '1.3');
    debuggerAttached = true;

    const result = await sendDebuggerCommand(tabId, 'Page.captureScreenshot', {
      format: settings.format === 'jpeg' ? 'jpeg' : 'png',
      quality: settings.format === 'jpeg' ? settings.quality : undefined,
      captureBeyondViewport: false,
    });

    const mimeType = settings.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    return `data:${mimeType};base64,${result.data}`;
  } catch (cdpErr) {
    console.warn('CDP viewport capture failed, attempting captureVisibleTab fallback:', cdpErr);

    const tab = await chrome.tabs.get(tabId);
    try {
      await chrome.windows.update(tab.windowId, { focused: true });
      await chrome.tabs.update(tabId, { active: true });
    } catch {
      // ignore focus errors
    }
    await sleep(300);

    const format = settings.format === 'jpeg' ? 'jpeg' : 'png';
    const options = { format };
    if (format === 'jpeg') {
      options.quality = settings.quality;
    }

    return new Promise((resolve, reject) => {
      chrome.tabs.captureVisibleTab(tab.windowId, options, (dataUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!dataUrl) {
          reject(new Error('Failed to capture visible tab image.'));
        } else {
          resolve(dataUrl);
        }
      });
    });
  } finally {
    if (debuggerAttached) {
      try {
        await chrome.debugger.detach({ tabId });
      } catch {
        // may already be detached
      }
    }
  }
}


// ========== HELPERS ==========

function sendDebuggerCommand(tabId, method, params = {}) {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand({ tabId }, method, params, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
}

function waitForTabLoad(tabId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      // Resolve anyway — some pages never fire 'complete'
      resolve();
    }, 30000);

    function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }

    chrome.tabs.onUpdated.addListener(listener);

    // Check if already loaded
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (tab.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFilename(job) {
  if (job.name) {
    return sanitizeFilename(job.name);
  }
  // Derive from URL
  try {
    const url = new URL(job.url);
    const domain = url.hostname.replace(/^www\./, '');
    const path = url.pathname.replace(/\//g, '_').replace(/^_|_$/g, '');
    const base = path ? `${domain}${path}` : domain;
    return sanitizeFilename(base);
  } catch {
    return `screenshot_${Date.now()}`;
  }
}

function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 100);
}

function buildFilePath(job, settings, batchDir = null) {
  const name = getFilename(job);
  const ext = settings.format === 'jpeg' ? 'jpg' : 'png';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const subfolder = (settings.subfolder || '').trim().replace(/^\/+|\/+$/g, '');

  const parts = [];
  if (subfolder) parts.push(subfolder);
  if (batchDir && typeof batchDir === 'string') {
    const cleanBatch = batchDir.trim().replace(/^\/+|\/+$/g, '');
    if (cleanBatch) parts.push(cleanBatch);
  }
  parts.push(`${name}_${timestamp}.${ext}`);

  return parts.join('/');
}

function downloadScreenshot(dataUrl, filename) {
  return new Promise((resolve, reject) => {
    chrome.downloads.download(
      {
        url: dataUrl,
        filename,
        saveAs: false,
        conflictAction: 'uniquify',
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(downloadId);
        }
      }
    );
  });
}

/**
 * Convert a base64 data URL to a Blob safely.
 * Prefers native fetch() for fast, low-memory C++ conversion, with atob fallback.
 */
async function dataUrlToBlob(dataUrl) {
  try {
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0]?.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const base64Str = (parts[1] || '').trim();
    const bstr = atob(base64Str);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
}

/**
 * Convert a Blob to a base64 Data URL.
 */
async function blobToDataUrl(blob) {
  // Always use arrayBuffer approach in service workers — FileReader can hang
  // when the service worker idles mid-read, causing Promises to never resolve.
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  const mimeType = blob.type || 'image/jpeg';
  return `data:${mimeType};base64,${btoa(binary)}`;
}

/**
 * Generate a scaled-down JPEG thumbnail data URL from a full data URL.
 * Uses OffscreenCanvas and direct binary decoding for service worker compatibility.
 */
async function generateThumbnail(dataUrl, maxWidth = 160, maxHeight = 100) {
  try {
    if (!dataUrl || typeof dataUrl !== 'string') return null;
    const blob = await dataUrlToBlob(dataUrl);
    if (!blob) return null;

    const bitmap = await createImageBitmap(blob);

    let width = bitmap.width;
    let height = bitmap.height;

    if (width > height) {
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }

    width = Math.max(1, Math.round(width));
    height = Math.max(1, Math.round(height));

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fill background with white to avoid JPEG alpha artifacts
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let thumbBlob;
    try {
      thumbBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
    } catch {
      try {
        thumbBlob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.8 });
      } catch {
        thumbBlob = await canvas.convertToBlob(); // default png
      }
    }

    if (!thumbBlob) return null;

    return await blobToDataUrl(thumbBlob);
  } catch (err) {
    console.warn('generateThumbnail failed:', err);
    return null;
  }
}

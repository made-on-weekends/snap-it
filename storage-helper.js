/**
 * Storage Helper for SnapIt Chrome Extension.
 * Manages saving and loading FileSystemDirectoryHandle in IndexedDB,
 * querying/requesting file system permissions, and writing data URLs
 * directly to a custom directory.
 */

const DB_NAME = 'SnapItDB';
const STORE_NAME = 'handles';
const KEY_NAME = 'outputDir';
const SCREENSHOTS_STORE = 'screenshots';

/**
 * Open IndexedDB database connection.
 */
function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(SCREENSHOTS_STORE)) {
        const screenshotStore = db.createObjectStore(SCREENSHOTS_STORE, { keyPath: 'id' });
        screenshotStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a screenshot data URL to IndexedDB cache.
 * @param {string} id - filename or unique key
 * @param {string} dataUrl - Full data URL
 * @param {string} [url] - Target URL optional secondary key
 */
async function saveCachedScreenshot(id, dataUrl, url = null) {
  if (!id || !dataUrl) return;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SCREENSHOTS_STORE, 'readwrite');
      const store = tx.objectStore(SCREENSHOTS_STORE);
      store.put({ id, dataUrl, url, timestamp: Date.now() });
      if (typeof id === 'string' && id.includes('/')) {
        const basename = id.split('/').pop();
        if (basename) {
          store.put({ id: basename, dataUrl, url, timestamp: Date.now() });
        }
      }
      if (url && url !== id) {
        store.put({ id: url, dataUrl, url, timestamp: Date.now() });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save screenshot in IndexedDB:', err);
  }
}

/**
 * Load a screenshot data URL from IndexedDB cache.
 * @param {string} id - filename or url
 * @returns {Promise<string|null>}
 */
async function loadCachedScreenshot(id) {
  if (!id) return null;
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(SCREENSHOTS_STORE, 'readonly');
      const store = tx.objectStore(SCREENSHOTS_STORE);
      const request = store.get(id);
      request.onsuccess = () => {
        if (request.result && request.result.dataUrl) {
          resolve(request.result.dataUrl);
          return;
        }
        // If not found and id contained a path, try basename
        if (typeof id === 'string' && id.includes('/')) {
          const basename = id.split('/').pop();
          const baseReq = store.get(basename);
          baseReq.onsuccess = () => {
            resolve(baseReq.result ? baseReq.result.dataUrl : null);
          };
          baseReq.onerror = () => resolve(null);
          return;
        }
        resolve(null);
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Failed to load screenshot from IndexedDB:', err);
    return null;
  }
}

/**
 * Save Directory Handle to IndexedDB.
 * @param {FileSystemDirectoryHandle} handle
 */
async function saveDirectoryHandle(handle) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(handle, KEY_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Load Directory Handle from IndexedDB.
 * @returns {Promise<FileSystemDirectoryHandle|null>}
 */
async function loadDirectoryHandle() {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(KEY_NAME);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to load directory handle from IndexedDB:', err);
    return null;
  }
}

/**
 * Clear Directory Handle from IndexedDB.
 */
async function clearDirectoryHandle() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(KEY_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Verify and request directory read/write permission.
 * @param {FileSystemDirectoryHandle} handle
 * @param {boolean} readWrite
 * @returns {Promise<boolean>}
 */
async function verifyPermission(handle, readWrite = true) {
  if (!handle) return false;
  const options = {};
  if (readWrite) {
    options.mode = 'readwrite';
  }
  try {
    // Check if permission was already granted
    if ((await handle.queryPermission(options)) === 'granted') {
      return true;
    }
    // Request permission (must be called from user gesture)
    if ((await handle.requestPermission(options)) === 'granted') {
      return true;
    }
  } catch (err) {
    console.error('Error verifying/requesting directory permission:', err);
  }
  return false;
}

/**
 * Recursively save a screenshot (data URL) to a custom directory handle.
 * Creates folders matching the file path path parts if required.
 * @param {FileSystemDirectoryHandle} directoryHandle
 * @param {string} dataUrl
 * @param {string} filename
 */
async function saveToCustomDirectory(directoryHandle, dataUrl, filename) {
  const parts = filename.split('/');
  let currentDir = directoryHandle;

  // Navigate / create subfolders recursively
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (part) {
      currentDir = await currentDir.getDirectoryHandle(part, { create: true });
    }
  }

  const fileBasename = parts[parts.length - 1];
  const fileHandle = await currentDir.getFileHandle(fileBasename, { create: true });
  const writable = await fileHandle.createWritable();

  // Convert dataUrl to Blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  await writable.write(blob);
  await writable.close();
}

/**
 * Scan a directory handle (and optional subfolder) to determine the highest
 * existing batch folder sequence number matching the pattern "batch-XX".
 * @param {FileSystemDirectoryHandle} directoryHandle
 * @param {string} [subfolder]
 * @returns {Promise<number>} Highest batch index found, or 0 if none.
 */
async function getHighestBatchNumberFromDirectory(directoryHandle, subfolder = '') {
  if (!directoryHandle) return 0;
  try {
    let currentDir = directoryHandle;
    if (subfolder && typeof subfolder === 'string') {
      const parts = subfolder.split('/').map(p => p.trim()).filter(Boolean);
      for (const part of parts) {
        try {
          currentDir = await currentDir.getDirectoryHandle(part);
        } catch {
          // Subfolder does not exist yet
          return 0;
        }
      }
    }

    let maxNum = 0;
    // Iterate directory entries if supported
    if (typeof currentDir.values === 'function') {
      for await (const handle of currentDir.values()) {
        if (handle.kind === 'directory') {
          const match = handle.name.match(/^batch-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      }
    } else if (typeof currentDir.entries === 'function') {
      for await (const [name, handle] of currentDir.entries()) {
        if (handle.kind === 'directory') {
          const match = name.match(/^batch-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      }
    }
    return maxNum;
  } catch (err) {
    console.warn('Failed to scan directory for batch sequence:', err);
    return 0;
  }
}

/**
 * Scan Chrome download history to find the highest existing batch folder sequence
 * number matching "batch-XX" under the target subfolder.
 * @param {string} [subfolder]
 * @returns {Promise<number>} Highest batch index found, or 0 if none.
 */
async function getHighestBatchNumberFromDownloads(subfolder = '') {
  if (typeof chrome === 'undefined' || !chrome.downloads || typeof chrome.downloads.search !== 'function') {
    return 0;
  }
  try {
    const items = await chrome.downloads.search({});
    if (!items || items.length === 0) return 0;

    const cleanSub = subfolder && typeof subfolder === 'string'
      ? subfolder.trim().replace(/^\/+|\/+$/g, '').toLowerCase()
      : '';
    let maxNum = 0;

    for (const item of items) {
      if (item.state === 'interrupted' || item.exists === false) {
        continue;
      }
      const filename = item.filename || '';
      if (!filename) continue;

      const norm = filename.replace(/\\/g, '/');

      if (cleanSub) {
        const subIndex = norm.toLowerCase().indexOf(`/${cleanSub}/`);
        if (subIndex === -1 && !norm.toLowerCase().startsWith(`${cleanSub}/`)) {
          continue;
        }
      }

      const match = norm.match(/\/batch-(\d+)(?:\/|$)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    return maxNum;
  } catch (err) {
    console.warn('Failed to scan downloads for batch sequence:', err);
    return 0;
  }
}

/**
 * Determine the next incremental batch folder name (e.g., "batch-01", "batch-02")
 * dynamically based on existing directories/downloads without relying on saved storage state.
 *
 * @param {Object} [settings] - Settings object
 * @param {FileSystemDirectoryHandle} [directoryHandle] - Custom directory handle if available
 * @returns {Promise<string>} Next batch folder name, e.g. "batch-01"
 */
async function determineNextBatchDir(settings = null, directoryHandle = null) {
  let highestNum = 0;
  const subfolder = settings?.subfolder || '';

  if (settings?.saveLocation === 'custom') {
    let handle = directoryHandle;
    if (!handle && typeof loadDirectoryHandle === 'function') {
      try {
        handle = await loadDirectoryHandle();
      } catch {
        handle = null;
      }
    }
    if (handle) {
      highestNum = await getHighestBatchNumberFromDirectory(handle, subfolder);
    }
  } else {
    highestNum = await getHighestBatchNumberFromDownloads(subfolder);
  }

  const nextSeq = (parseInt(highestNum, 10) || 0) + 1;
  return `batch-${String(nextSeq).padStart(2, '0')}`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDB,
    saveCachedScreenshot,
    loadCachedScreenshot,
    saveDirectoryHandle,
    loadDirectoryHandle,
    clearDirectoryHandle,
    verifyPermission,
    saveToCustomDirectory,
    getHighestBatchNumberFromDirectory,
    getHighestBatchNumberFromDownloads,
    determineNextBatchDir,
  };
}



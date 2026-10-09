/**
 * SnapIt — In-Page Area Selection Overlay
 *
 * Implements a high-precision, interactive viewport capture overlay:
 * - Isolated within a closed Shadow DOM (zero host page CSS pollution).
 * - Smart Element Snapping: hover over any page element to preview and snap on click.
 * - Element Hierarchy Traversal: ArrowUp / ArrowDown (↑/↓) expands to parent or shrinks to child.
 * - Full-page neutral scrim with SVG cutout mask (100% untinted aperture).
 * - Live tabular Geist Mono coordinate and dimension readouts.
 * - 4 square corner handles (8px) with surface fill and border-strong edge.
 * - Floating action pill with two-ring edge (Cancel, Annotate, Download, Copy).
 * - Keyboard navigation (Esc, Enter, Space+drag, Shift+Arrows).
 * - Background scroll freeze to prevent parallax misalignment during framing.
 * - High-DPI devicePixelRatio scaling for pristine captures.
 */

(() => {
  // Prevent duplicate instances
  const HOST_ID = '__snapit_area_overlay_host__';
  const existingHost = document.getElementById(HOST_ID);
  if (existingHost) {
    existingHost.remove();
  }

  // Create isolated host element
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:auto;user-select:none;-webkit-user-select:none;margin:0;padding:0;border:none;overflow:hidden;';

  const shadow = host.attachShadow({ mode: 'closed' });

  // Load theme preference if available
  let activeTheme = 'dark';
  try {
    chrome.storage.sync.get('settings', (res) => {
      const themeSetting = res?.settings?.theme || 'system';
      if (themeSetting === 'light') {
        setTheme('light');
      } else if (themeSetting === 'dark') {
        setTheme('dark');
      } else {
        const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        setTheme(prefersLight ? 'light' : 'dark');
      }
    });
  } catch {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    activeTheme = prefersLight ? 'light' : 'dark';
  }

  function setTheme(t) {
    activeTheme = t;
    if (container) {
      container.className = `overlay-container theme-${t}`;
    }
  }

  // Stylesheet
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .overlay-container {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      cursor: crosshair;
    }

    /* Dark Mode (Default) */
    .theme-dark {
      --bg: #0C0E12;
      --surface: #21252C;
      --surface-sunken: #14171C;
      --text: #ECEEF2;
      --secondary: #BCC1CC;
      --muted: #8B93A1;
      --border: #343A44;
      --border-strong: #8B93A1;
      --accent: #00A4E4;
      --accent-hover: #00C0F1;
      --on-accent: #0C0E12;
      --scrim: rgba(6, 7, 9, 0.62);
      --two-ring-shadow: 0 0 0 1px #8B93A1, 0 0 0 2px rgba(255, 255, 255, 0.40);
      --crosshair-line: rgba(255, 255, 255, 0.35);
    }

    /* Light Mode */
    .theme-light {
      --bg: #F6F7F9;
      --surface: #FFFFFF;
      --surface-sunken: #ECEEF2;
      --text: #14171C;
      --secondary: #4A515D;
      --muted: #646C7B;
      --border: #DCDFE6;
      --border-strong: #646C7B;
      --accent: #006DAB;
      --accent-hover: #0087D1;
      --on-accent: #FFFFFF;
      --scrim: rgba(6, 7, 9, 0.62);
      --two-ring-shadow: 0 0 0 1px #646C7B, 0 0 0 2px rgba(0, 0, 0, 0.20);
      --crosshair-line: rgba(0, 0, 0, 0.28);
    }

    /* Full-screen SVG aperture & mask */
    .overlay-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .scrim-rect {
      pointer-events: all;
      cursor: crosshair;
    }

    /* Guide Hairlines */
    .crosshair-line-h {
      position: absolute;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--crosshair-line);
      pointer-events: none;
      z-index: 12;
      display: none;
    }

    .crosshair-line-v {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: var(--crosshair-line);
      pointer-events: none;
      z-index: 12;
      display: none;
    }

    .crosshair-reticle {
      position: absolute;
      width: 17px;
      height: 17px;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 14;
      display: none;
    }

    /* Smart Element Hover Preview */
    .element-hover-box {
      position: absolute;
      border: 1.5px solid var(--accent);
      background: rgba(0, 164, 228, 0.12);
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
      border-radius: 2px;
      pointer-events: none;
      z-index: 15;
      display: none;
      transition: all 0.05s ease-out;
    }

    .element-tag-badge {
      position: absolute;
      font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      line-height: 1;
      color: var(--on-accent);
      background: var(--accent);
      border-radius: 4px;
      padding: 3px 6px;
      box-shadow: var(--two-ring-shadow);
      white-space: nowrap;
      pointer-events: none;
      z-index: 26;
      display: none;
      align-items: center;
      gap: 5px;
    }

    .element-tag-badge .badge-tag {
      font-weight: 600;
    }

    .element-tag-badge .badge-sep {
      opacity: 0.6;
    }

    .element-tag-badge .badge-dim {
      opacity: 0.9;
    }

    /* Top-Center Floating Guide Pill */
    .overlay-guide-pill {
      position: absolute;
      top: 18px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--surface);
      color: var(--text);
      border-radius: 20px;
      box-shadow: var(--two-ring-shadow);
      font-size: 11px;
      font-weight: 500;
      padding: 6px 14px;
      z-index: 35;
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
      white-space: nowrap;
      transition: opacity 0.25s ease, transform 0.25s ease;
    }

    .overlay-guide-pill.dismissed {
      opacity: 0;
      transform: translateX(-50%) translateY(-6px);
      pointer-events: none;
    }

    .guide-bullet {
      opacity: 0.35;
    }

    /* Drag Box for moving selection */
    .selection-drag-box {
      position: absolute;
      cursor: move;
      z-index: 16;
      display: none;
    }

    /* Dimension Readout Badge */
    .dimension-badge {
      position: absolute;
      font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      line-height: 1;
      color: var(--text);
      background: var(--surface);
      border-radius: 6px;
      padding: 4px 8px;
      box-shadow: var(--two-ring-shadow);
      white-space: nowrap;
      pointer-events: none;
      z-index: 25;
      display: none;
      align-items: center;
      gap: 4px;
    }

    /* Corner Handles (8px square, surface fill, border-strong) */
    .corner-handle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: 0;
      z-index: 22;
      display: none;
    }

    .handle-nw { cursor: nwse-resize; }
    .handle-ne { cursor: nesw-resize; }
    .handle-sw { cursor: nesw-resize; }
    .handle-se { cursor: nwse-resize; }

    /* Floating Action Pill Toolbar */
    .floating-toolbar {
      position: absolute;
      background: var(--surface);
      border-radius: 8px;
      height: 38px;
      padding: 3px 6px;
      display: none;
      align-items: center;
      gap: 6px;
      box-shadow: var(--two-ring-shadow);
      z-index: 30;
      cursor: default;
      transition: opacity 0.15s ease;
    }

    .toolbar-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      height: 28px;
      padding: 0 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      background: transparent;
      color: var(--text);
      transition: background-color 0.1s ease, color 0.1s ease;
      white-space: nowrap;
      font-family: inherit;
    }

    .toolbar-btn:hover {
      background: var(--surface-sunken);
    }

    .btn-ghost {
      color: var(--secondary);
    }

    .btn-ghost:hover {
      color: var(--text);
    }

    .btn-secondary {
      border: 1px solid var(--border-strong);
      color: var(--text);
    }

    .btn-primary {
      background: var(--accent);
      color: var(--on-accent);
      font-weight: 600;
      border: none;
    }

    .btn-primary:hover {
      background: var(--accent-hover);
    }

    .btn-divider {
      width: 1px;
      height: 16px;
      background: var(--border);
      margin: 0 2px;
    }

    .btn-keycap {
      font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
      color: var(--muted);
      opacity: 0.8;
      margin-left: 2px;
    }

    .btn-primary .btn-keycap {
      color: var(--on-accent);
      opacity: 0.7;
    }

    /* Toast Notification */
    .overlay-toast {
      position: absolute;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--surface);
      color: var(--text);
      border-radius: 6px;
      box-shadow: var(--two-ring-shadow);
      font-size: 12px;
      font-weight: 500;
      padding: 7px 16px;
      z-index: 100;
      display: none;
      align-items: center;
      gap: 6px;
      font-family: inherit;
    }
  `;

  // Root container
  const container = document.createElement('div');
  container.className = `overlay-container theme-${activeTheme}`;

  // SVG Mask & Scrim
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'overlay-svg');

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
  mask.setAttribute('id', 'snapit-scrim-mask');

  const maskWhite = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  maskWhite.setAttribute('x', '0');
  maskWhite.setAttribute('y', '0');
  maskWhite.setAttribute('width', '100%');
  maskWhite.setAttribute('height', '100%');
  maskWhite.setAttribute('fill', 'white');
  mask.appendChild(maskWhite);

  const maskHole = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  maskHole.setAttribute('id', 'mask-hole');
  maskHole.setAttribute('x', '0');
  maskHole.setAttribute('y', '0');
  maskHole.setAttribute('width', '0');
  maskHole.setAttribute('height', '0');
  maskHole.setAttribute('fill', 'black');
  mask.appendChild(maskHole);
  defs.appendChild(mask);
  svg.appendChild(defs);

  const scrimRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  scrimRect.setAttribute('class', 'scrim-rect');
  scrimRect.setAttribute('x', '0');
  scrimRect.setAttribute('y', '0');
  scrimRect.setAttribute('width', '100%');
  scrimRect.setAttribute('height', '100%');
  scrimRect.setAttribute('fill', 'var(--scrim)');
  scrimRect.setAttribute('mask', 'url(#snapit-scrim-mask)');
  svg.appendChild(scrimRect);

  const selectionBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  selectionBorder.setAttribute('id', 'selection-border');
  selectionBorder.setAttribute('x', '0');
  selectionBorder.setAttribute('y', '0');
  selectionBorder.setAttribute('width', '0');
  selectionBorder.setAttribute('height', '0');
  selectionBorder.setAttribute('fill', 'none');
  selectionBorder.setAttribute('stroke', 'var(--accent)');
  selectionBorder.setAttribute('stroke-width', '2');
  selectionBorder.style.display = 'none';
  svg.appendChild(selectionBorder);

  container.appendChild(svg);

  // Guide hairlines
  const crosshairH = document.createElement('div');
  crosshairH.className = 'crosshair-line-h';
  container.appendChild(crosshairH);

  const crosshairV = document.createElement('div');
  crosshairV.className = 'crosshair-line-v';
  container.appendChild(crosshairV);

  // Reticle
  const reticle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  reticle.setAttribute('class', 'crosshair-reticle');
  reticle.setAttribute('viewBox', '0 0 17 17');
  reticle.innerHTML = `
    <circle cx="8.5" cy="8.5" r="4.5" stroke="var(--text)" stroke-width="1.5" />
    <circle cx="8.5" cy="8.5" r="1" fill="var(--accent)" />
  `;
  container.appendChild(reticle);

  // Smart Element Hover Box & Tag Badge
  const elementHoverBox = document.createElement('div');
  elementHoverBox.className = 'element-hover-box';
  container.appendChild(elementHoverBox);

  const elementTagBadge = document.createElement('div');
  elementTagBadge.className = 'element-tag-badge';
  container.appendChild(elementTagBadge);

  // Top Guide Pill
  const guidePill = document.createElement('div');
  guidePill.className = 'overlay-guide-pill';
  guidePill.innerHTML = `
    <span>Click element to snap</span>
    <span class="guide-bullet">•</span>
    <span>Drag for custom area</span>
    <span class="guide-bullet">•</span>
    <span><span class="btn-keycap">↑</span><span class="btn-keycap">↓</span> hierarchy</span>
    <span class="guide-bullet">•</span>
    <span><span class="btn-keycap">Esc</span> exit</span>
  `;
  container.appendChild(guidePill);

  // Drag box for moving selection
  const dragBox = document.createElement('div');
  dragBox.className = 'selection-drag-box';
  container.appendChild(dragBox);

  // Handles
  const handles = {
    nw: document.createElement('div'),
    ne: document.createElement('div'),
    sw: document.createElement('div'),
    se: document.createElement('div'),
  };
  handles.nw.className = 'corner-handle handle-nw';
  handles.ne.className = 'corner-handle handle-ne';
  handles.sw.className = 'corner-handle handle-sw';
  handles.se.className = 'corner-handle handle-se';

  container.appendChild(handles.nw);
  container.appendChild(handles.ne);
  container.appendChild(handles.sw);
  container.appendChild(handles.se);

  // Dimension Badge
  const dimensionBadge = document.createElement('div');
  dimensionBadge.className = 'dimension-badge';
  container.appendChild(dimensionBadge);

  // Toast
  const toast = document.createElement('div');
  toast.className = 'overlay-toast';
  container.appendChild(toast);

  function showToast(text, duration = 1200) {
    toast.textContent = text;
    toast.style.display = 'flex';
    setTimeout(() => {
      toast.style.display = 'none';
    }, duration);
  }

  // Floating Action Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'floating-toolbar';
  toolbar.innerHTML = `
    <button type="button" class="toolbar-btn btn-ghost" id="action-cancel" title="Cancel (Esc)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      <span>Cancel</span>
      <span class="btn-keycap">Esc</span>
    </button>
    <div class="btn-divider"></div>
    <button type="button" class="toolbar-btn btn-secondary" id="action-annotate" title="Annotate">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
      </svg>
      <span>Annotate</span>
    </button>
    <button type="button" class="toolbar-btn btn-secondary" id="action-download" title="Download Screenshot">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>Download</span>
    </button>
    <button type="button" class="toolbar-btn btn-primary" id="action-copy" title="Copy to Clipboard (Enter)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="8" y="8" width="14" height="14" rx="2"></rect>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
      </svg>
      <span>Copy</span>
      <span class="btn-keycap">↵</span>
    </button>
  `;
  container.appendChild(toolbar);

  shadow.appendChild(style);
  shadow.appendChild(container);
  document.documentElement.appendChild(host);

  // State
  let selection = null; // { x, y, width, height }
  let isDragging = false;
  let dragMode = null; // 'create' | 'move' | 'nw' | 'ne' | 'sw' | 'se'
  let dragStart = { x: 0, y: 0 };
  let initialSelection = null;
  let isSpacePressed = false;
  let lastMousePos = { x: 0, y: 0 };

  // Smart Element Snapping State
  let hoveredElements = []; // Hierarchy chain [leaf, parent, grandparent, ...]
  let hoveredIndex = 0;
  let activeHoveredElement = null;
  let pointerDownPos = null;
  let rafPending = false;
  let guidePillDismissed = false;

  function dismissGuidePill() {
    if (!guidePillDismissed) {
      guidePillDismissed = true;
      guidePill.classList.add('dismissed');
    }
  }

  // Freeze page background scrolling while overlay is open
  function preventScroll(e) {
    e.preventDefault();
  }
  window.addEventListener('wheel', preventScroll, { passive: false });
  window.addEventListener('touchmove', preventScroll, { passive: false });

  // Cleanup helper
  function tearDown() {
    window.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('keyup', handleKeyUp, true);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('wheel', preventScroll, { passive: false });
    window.removeEventListener('touchmove', preventScroll, { passive: false });
    if (host.parentNode) {
      host.parentNode.removeChild(host);
    }
  }

  // Element Filtering & Resolution
  function isValidSnapTarget(el) {
    if (!el || el === host || host.contains(el)) return false;
    if (el === document.documentElement || el === document.body) return false;
    const tagName = el.tagName.toLowerCase();
    if (tagName === 'script' || tagName === 'style' || tagName === 'noscript' || tagName === 'meta' || tagName === 'link') {
      return false;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width <= 2 || rect.height <= 2) return false;

    try {
      const computed = window.getComputedStyle(el);
      if (computed.display === 'none' || computed.visibility === 'hidden' || parseFloat(computed.opacity) === 0) {
        return false;
      }
    } catch {
      return false;
    }
    return true;
  }

  function resolveSnapElement(el) {
    if (!el) return null;
    // Map SVG children (<path>, <circle>, etc.) up to parent <svg>
    if (el.ownerSVGElement) {
      return el.ownerSVGElement;
    }
    return el;
  }

  function buildHierarchyChain(targetEl) {
    const chain = [];
    let cur = targetEl;
    while (cur && cur !== document.documentElement && cur !== document.body) {
      if (isValidSnapTarget(cur)) {
        chain.push(cur);
      }
      cur = cur.parentElement;
    }
    return chain;
  }

  function findElementUnderPoint(clientX, clientY) {
    const elements = document.elementsFromPoint(clientX, clientY);
    for (const el of elements) {
      const resolved = resolveSnapElement(el);
      if (isValidSnapTarget(resolved)) {
        return resolved;
      }
    }
    return null;
  }

  // Update Visuals
  function render() {
    if (!selection || selection.width <= 0 || selection.height <= 0) {
      maskHole.setAttribute('width', '0');
      maskHole.setAttribute('height', '0');
      selectionBorder.style.display = 'none';
      dragBox.style.display = 'none';
      handles.nw.style.display = 'none';
      handles.ne.style.display = 'none';
      handles.sw.style.display = 'none';
      handles.se.style.display = 'none';
      dimensionBadge.style.display = 'none';
      toolbar.style.display = 'none';
      return;
    }

    const { x, y, width, height } = selection;

    // Hide element hover preview when selection exists
    updateElementHoverPreview(null);

    // SVG Mask Aperture & Border
    maskHole.setAttribute('x', x);
    maskHole.setAttribute('y', y);
    maskHole.setAttribute('width', width);
    maskHole.setAttribute('height', height);

    selectionBorder.setAttribute('x', x);
    selectionBorder.setAttribute('y', y);
    selectionBorder.setAttribute('width', width);
    selectionBorder.setAttribute('height', height);
    selectionBorder.style.display = 'block';

    // Drag box
    dragBox.style.left = `${x}px`;
    dragBox.style.top = `${y}px`;
    dragBox.style.width = `${width}px`;
    dragBox.style.height = `${height}px`;
    dragBox.style.display = 'block';

    // Handles (8px square centered at corners: offset -4px)
    handles.nw.style.left = `${x - 4}px`;
    handles.nw.style.top = `${y - 4}px`;
    handles.nw.style.display = 'block';

    handles.ne.style.left = `${x + width - 4}px`;
    handles.ne.style.top = `${y - 4}px`;
    handles.ne.style.display = 'block';

    handles.sw.style.left = `${x - 4}px`;
    handles.sw.style.top = `${y + height - 4}px`;
    handles.sw.style.display = 'block';

    handles.se.style.left = `${x + width - 4}px`;
    handles.se.style.top = `${y + height - 4}px`;
    handles.se.style.display = 'block';

    // Dimension Readout Badge
    const dpr = window.devicePixelRatio || 1;
    const physWidth = Math.round(width * dpr);
    const physHeight = Math.round(height * dpr);
    dimensionBadge.textContent = `${physWidth} × ${physHeight}`;
    dimensionBadge.style.display = 'inline-flex';

    // Collision Rule: 8px above selection; if y < 32px, flips 8px inside top-left
    if (y < 32) {
      dimensionBadge.style.left = `${x + 8}px`;
      dimensionBadge.style.top = `${y + 8}px`;
    } else {
      dimensionBadge.style.left = `${x}px`;
      dimensionBadge.style.top = `${y - 28}px`;
    }

    // Action Toolbar Placement (Adjacent to selection)
    if (!isDragging && width >= 40 && height >= 30) {
      toolbar.style.display = 'flex';
      const toolbarHeight = 38;
      const toolbarMargin = 8;
      let tbTop = y + height + toolbarMargin;

      // Flip above or inside bottom if colliding with bottom edge
      if (tbTop + toolbarHeight > window.innerHeight) {
        if (y - toolbarHeight - toolbarMargin >= 0) {
          tbTop = y - toolbarHeight - toolbarMargin;
        } else {
          tbTop = Math.max(8, y + height - toolbarHeight - toolbarMargin);
        }
      }

      // Constrain within horizontal viewport
      const maxLeft = Math.max(8, window.innerWidth - 420);
      const tbLeft = Math.max(8, Math.min(x, maxLeft));

      toolbar.style.left = `${tbLeft}px`;
      toolbar.style.top = `${tbTop}px`;
    } else {
      toolbar.style.display = 'none';
    }
  }

  // Element Hover Preview Rendering
  function updateElementHoverPreview(el) {
    if (!el || selection || isDragging) {
      elementHoverBox.style.display = 'none';
      elementTagBadge.style.display = 'none';
      activeHoveredElement = null;
      return;
    }

    activeHoveredElement = el;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.round(rect.left));
    const y = Math.max(0, Math.round(rect.top));
    const width = Math.min(window.innerWidth - x, Math.round(rect.width));
    const height = Math.min(window.innerHeight - y, Math.round(rect.height));

    if (width <= 0 || height <= 0) {
      elementHoverBox.style.display = 'none';
      elementTagBadge.style.display = 'none';
      return;
    }

    elementHoverBox.style.left = `${x}px`;
    elementHoverBox.style.top = `${y}px`;
    elementHoverBox.style.width = `${width}px`;
    elementHoverBox.style.height = `${height}px`;
    elementHoverBox.style.display = 'block';

    // Format badge text: tag name + class/id
    const tag = el.tagName.toLowerCase();
    let identifier = '';
    if (el.id) {
      identifier = `#${el.id}`;
    } else if (el.classList && el.classList.length > 0) {
      identifier = `.${el.classList[0]}`;
    }

    const dpr = window.devicePixelRatio || 1;
    const physW = Math.round(width * dpr);
    const physH = Math.round(height * dpr);

    elementTagBadge.textContent = '';
    const tagSpan = document.createElement('span');
    tagSpan.className = 'badge-tag';
    tagSpan.textContent = `${tag}${identifier}`;
    const sepSpan = document.createElement('span');
    sepSpan.className = 'badge-sep';
    sepSpan.textContent = '·';
    const dimSpan = document.createElement('span');
    dimSpan.className = 'badge-dim';
    dimSpan.textContent = `${physW} × ${physH}`;
    elementTagBadge.append(tagSpan, sepSpan, dimSpan);
    elementTagBadge.style.display = 'inline-flex';

    if (y < 28) {
      elementTagBadge.style.left = `${x + 6}px`;
      elementTagBadge.style.top = `${y + 6}px`;
    } else {
      elementTagBadge.style.left = `${x}px`;
      elementTagBadge.style.top = `${y - 24}px`;
    }
  }

  // Crosshairs & Cursor guide updates
  function updateCrosshairs(clientX, clientY) {
    if (isDragging) {
      crosshairH.style.display = 'none';
      crosshairV.style.display = 'none';
      reticle.style.display = 'none';
      return;
    }
    crosshairH.style.top = `${clientY}px`;
    crosshairH.style.display = 'block';

    crosshairV.style.left = `${clientX}px`;
    crosshairV.style.display = 'block';

    reticle.style.left = `${clientX}px`;
    reticle.style.top = `${clientY}px`;
    reticle.style.display = 'block';

    // If no active selection and no element hovered, badge tracks cursor position
    if (!selection) {
      if (!activeHoveredElement) {
        dimensionBadge.textContent = `X: ${clientX}  Y: ${clientY}`;
        dimensionBadge.style.left = `${clientX + 14}px`;
        dimensionBadge.style.top = `${clientY + 14}px`;
        dimensionBadge.style.display = 'inline-flex';
      } else {
        dimensionBadge.style.display = 'none';
      }
    }
  }

  // Mouse Listeners
  container.addEventListener('mousemove', (e) => {
    lastMousePos = { x: e.clientX, y: e.clientY };
    updateCrosshairs(e.clientX, e.clientY);

    // If mouse was pressed on background, check if user exceeded drag threshold
    if (pointerDownPos && !isDragging) {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist >= 4) {
        dismissGuidePill();
        startDrag({
          clientX: pointerDownPos.x,
          clientY: pointerDownPos.y,
          button: 0,
          stopPropagation: () => {},
          preventDefault: () => {},
        }, 'create');
        selection = { x: pointerDownPos.x, y: pointerDownPos.y, width: 0, height: 0 };
        updateElementHoverPreview(null);
      }
    }

    if (!isDragging) {
      // Element detection preview (throttled via RAF)
      if (!selection && !pointerDownPos) {
        if (!rafPending) {
          rafPending = true;
          requestAnimationFrame(() => {
            rafPending = false;
            const candidate = findElementUnderPoint(e.clientX, e.clientY);
            if (candidate !== hoveredElements[0]) {
              hoveredElements = buildHierarchyChain(candidate);
              hoveredIndex = 0;
            }
            const currentTarget = hoveredElements[hoveredIndex] || null;
            updateElementHoverPreview(currentTarget);
          });
        }
      }
      return;
    }

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (dragMode === 'create') {
      const left = Math.min(dragStart.x, e.clientX);
      const top = Math.min(dragStart.y, e.clientY);
      const width = Math.abs(e.clientX - dragStart.x);
      const height = Math.abs(e.clientY - dragStart.y);
      selection = {
        x: Math.max(0, Math.round(left)),
        y: Math.max(0, Math.round(top)),
        width: Math.min(window.innerWidth - left, Math.round(width)),
        height: Math.min(window.innerHeight - top, Math.round(height)),
      };
    } else if (dragMode === 'move') {
      const newX = Math.max(0, Math.min(window.innerWidth - initialSelection.width, initialSelection.x + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - initialSelection.height, initialSelection.y + dy));
      selection = {
        ...initialSelection,
        x: Math.round(newX),
        y: Math.round(newY),
      };
    } else if (dragMode === 'se') {
      const w = Math.max(10, initialSelection.width + dx);
      const h = Math.max(10, initialSelection.height + dy);
      selection = {
        ...initialSelection,
        width: Math.min(window.innerWidth - initialSelection.x, Math.round(w)),
        height: Math.min(window.innerHeight - initialSelection.y, Math.round(h)),
      };
    } else if (dragMode === 'sw') {
      const newX = Math.min(initialSelection.x + initialSelection.width - 10, initialSelection.x + dx);
      const w = initialSelection.width + (initialSelection.x - newX);
      const h = Math.max(10, initialSelection.height + dy);
      selection = {
        x: Math.max(0, Math.round(newX)),
        y: initialSelection.y,
        width: Math.round(w),
        height: Math.min(window.innerHeight - initialSelection.y, Math.round(h)),
      };
    } else if (dragMode === 'ne') {
      const newY = Math.min(initialSelection.y + initialSelection.height - 10, initialSelection.y + dy);
      const h = initialSelection.height + (initialSelection.y - newY);
      const w = Math.max(10, initialSelection.width + dx);
      selection = {
        x: initialSelection.x,
        y: Math.max(0, Math.round(newY)),
        width: Math.min(window.innerWidth - initialSelection.x, Math.round(w)),
        height: Math.round(h),
      };
    } else if (dragMode === 'nw') {
      const newX = Math.min(initialSelection.x + initialSelection.width - 10, initialSelection.x + dx);
      const newY = Math.min(initialSelection.y + initialSelection.height - 10, initialSelection.y + dy);
      const w = initialSelection.width + (initialSelection.x - newX);
      const h = initialSelection.height + (initialSelection.y - newY);
      selection = {
        x: Math.max(0, Math.round(newX)),
        y: Math.max(0, Math.round(newY)),
        width: Math.round(w),
        height: Math.round(h),
      };
    }

    render();
  });

  // Start drag handlers
  function startDrag(e, mode) {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    isDragging = true;
    dragMode = mode;
    dragStart = { x: e.clientX, y: e.clientY };
    initialSelection = selection ? { ...selection } : null;

    crosshairH.style.display = 'none';
    crosshairV.style.display = 'none';
    reticle.style.display = 'none';
    toolbar.style.display = 'none';
    updateElementHoverPreview(null);
  }

  // Handle mousedown on scrim / background
  scrimRect.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    pointerDownPos = { x: e.clientX, y: e.clientY };
  });

  // Drag box for moving
  dragBox.addEventListener('mousedown', (e) => {
    dismissGuidePill();
    startDrag(e, 'move');
  });

  // Handle mousedown on handles
  handles.nw.addEventListener('mousedown', (e) => { dismissGuidePill(); startDrag(e, 'nw'); });
  handles.ne.addEventListener('mousedown', (e) => { dismissGuidePill(); startDrag(e, 'ne'); });
  handles.sw.addEventListener('mousedown', (e) => { dismissGuidePill(); startDrag(e, 'sw'); });
  handles.se.addEventListener('mousedown', (e) => { dismissGuidePill(); startDrag(e, 'se'); });

  // Global mouseup inside host
  window.addEventListener('mouseup', (e) => {
    // If user clicked without dragging over an element, snap immediately to the element
    if (pointerDownPos && !isDragging) {
      dismissGuidePill();
      if (activeHoveredElement) {
        const rect = activeHoveredElement.getBoundingClientRect();
        const x = Math.max(0, Math.round(rect.left));
        const y = Math.max(0, Math.round(rect.top));
        const width = Math.min(window.innerWidth - x, Math.round(rect.width));
        const height = Math.min(window.innerHeight - y, Math.round(rect.height));

        if (width >= 8 && height >= 8) {
          selection = { x, y, width, height };
        }
      } else {
        // Click on empty space clears selection
        selection = null;
      }
      pointerDownPos = null;
      render();
      updateCrosshairs(e.clientX, e.clientY);
      return;
    }

    pointerDownPos = null;

    if (!isDragging) return;
    isDragging = false;
    dragMode = null;

    if (selection && (selection.width < 8 || selection.height < 8)) {
      selection = null;
    }
    render();
  });

  // Keyboard navigation
  function handleKeyDown(e) {
    dismissGuidePill();

    // Hierarchy traversal when hovering over elements without committed selection
    if (!selection && hoveredElements.length > 1) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        if (hoveredIndex < hoveredElements.length - 1) {
          hoveredIndex++;
          updateElementHoverPreview(hoveredElements[hoveredIndex]);
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        if (hoveredIndex > 0) {
          hoveredIndex--;
          updateElementHoverPreview(hoveredElements[hoveredIndex]);
        }
        return;
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (selection) {
        selection = null;
        render();
        updateCrosshairs(lastMousePos.x, lastMousePos.y);
        return;
      }
      tearDown();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (selection && selection.width > 0 && selection.height > 0) {
        performCapture('copy');
      }
      return;
    }

    if (e.key === ' ' && !isSpacePressed) {
      isSpacePressed = true;
      if (selection) {
        container.style.cursor = 'move';
      }
    }

    // Arrow keys nudge selection when selection is active
    if (selection && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;
      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;

      selection.x = Math.max(0, Math.min(window.innerWidth - selection.width, selection.x + dx));
      selection.y = Math.max(0, Math.min(window.innerHeight - selection.height, selection.y + dy));
      render();
    }
  }

  function handleKeyUp(e) {
    if (e.key === ' ') {
      isSpacePressed = false;
      container.style.cursor = 'crosshair';
    }
  }

  function handleResize() {
    if (selection) {
      selection.width = Math.min(selection.width, window.innerWidth - selection.x);
      selection.height = Math.min(selection.height, window.innerHeight - selection.y);
      render();
    }
  }

  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('keyup', handleKeyUp, true);
  window.addEventListener('resize', handleResize);

  // Guarantee a PNG Blob for ClipboardItem
  async function ensurePngBlob(dataUrl) {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    if (blob.type === 'image/png') return blob;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((pngBlob) => resolve(pngBlob || blob), 'image/png');
      };
      img.onerror = () => resolve(blob);
      img.src = dataUrl;
    });
  }

  // Capture Execution
  async function performCapture(action) {
    if (!selection || selection.width < 5 || selection.height < 5) return;

    // Immediately hide all overlay chrome so target page is captured pristine
    container.style.visibility = 'hidden';

    // Wait a frame for browser reflow
    await new Promise((r) => requestAnimationFrame(r));

    const dpr = window.devicePixelRatio || 1;
    const clip = {
      x: selection.x,
      y: selection.y,
      width: selection.width,
      height: selection.height,
      dpr,
    };

    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'CAPTURE_AREA',
          clip,
          action,
        }, resolve);
      });

      if (response && response.error) {
        throw new Error(response.error);
      }

      if (action === 'copy' && response?.dataUrl) {
        container.style.visibility = 'visible';
        try {
          const pngBlob = await ensurePngBlob(response.dataUrl);
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
          showToast('Copied', 1200);
        } catch (clipErr) {
          console.warn('Clipboard write fallback/error:', clipErr);
          showToast('Clipboard write failed', 1400);
        }
        setTimeout(tearDown, 1200);
      } else if (action === 'download') {
        container.style.visibility = 'visible';
        showToast('Saved', 1200);
        setTimeout(tearDown, 1200);
      } else {
        tearDown();
      }
    } catch (err) {
      container.style.visibility = 'visible';
      showToast(`Error: ${err.message}`, 2500);
      setTimeout(tearDown, 2600);
    }
  }

  // Wire Toolbar Buttons
  const cancelBtn = shadow.getElementById('action-cancel');
  const annotateBtn = shadow.getElementById('action-annotate') || shadow.getElementById('action-studio');
  const downloadBtn = shadow.getElementById('action-download');
  const copyBtn = shadow.getElementById('action-copy');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      tearDown();
    });
  }

  if (annotateBtn) {
    annotateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      performCapture('annotate');
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      performCapture('download');
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      performCapture('copy');
    });
  }
})();

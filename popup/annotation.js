/**
 * SnapIt Annotation Studio
 * High-performance, zero-dependency HTML5 Canvas annotation and markup engine.
 * Supports Freehand Pen, Arrows, Rectangles, Ellipses, Text, Highlighting, Blur/Redaction, and Step Badges.
 * Features element selection, movement, resize handles, rich text styling, custom line styles, and viewport fitting.
 */

class AnnotationStudio {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.onToolChange = options.onToolChange || null;
    this.onSelectionChange = options.onSelectionChange || null;
    this.onTextModeActive = options.onTextModeActive || null;
    this.onSpotlightToggle = options.onSpotlightToggle || null;

    // Canvas elements
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'annotation-canvas-wrapper';

    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.className = 'annotation-bg-canvas';
    this.bgCtx = this.bgCanvas.getContext('2d', { willReadFrequently: true });

    this.drawCanvas = document.createElement('canvas');
    this.drawCanvas.className = 'annotation-draw-canvas';
    this.drawCtx = this.drawCanvas.getContext('2d');

    this.wrapper.appendChild(this.bgCanvas);
    this.wrapper.appendChild(this.drawCanvas);
    this.container.appendChild(this.wrapper);

    // State
    this.baseImage = null;
    this.imageWidth = 0;
    this.imageHeight = 0;
    this.zoom = 1;

    // Drawing Tool State
    this.currentTool = 'arrow'; // 'select', 'pen', 'arrow', 'rect', 'ellipse', 'text', 'highlight', 'blur', 'step', 'stamp'
    this.currentColor = '#E5484D'; // Red default for annotations
    this.strokeWidth = 4;
    this.lineStyle = 'solid'; // 'solid', 'dashed', 'dotted'
    this.arrowStyle = 'standard'; // 'standard', 'open', 'line', 'double'
    this.stepCounter = 1;
    this.currentStamp = 'check'; // 'check', 'cross', 'star', 'warning', 'question', 'heart'
    this.currentZoomLevel = 2.0; // Zoom loupe magnification level (1.5, 2.0, 3.0, 4.0)
    this.zoomHasHandle = true; // Zoom loupe handle toggle
    this.currentRedactMode = 'blur'; // 'blur', 'mosaic', 'blackout'
    this.currentSpotlightShape = 'circle'; // 'circle', 'oval', 'rect'
    this.currentSpotlightMode = 'dark'; // 'dark', 'blur', 'light'
    this.currentSpotlightRing = true; // Show illuminated glowing ring around spotlight
    this.isSpotlight = false; // Spotlight focus toggle option (dims canvas and illuminates cutout)
    this.hasFrame = false; // Presentation canvas background frame toggle

    // Text Tool Properties
    this.fontFamily = "'Inter', system-ui, sans-serif";
    this.fontSize = 18;
    this.isBold = true;
    this.isItalic = false;
    this.isUnderline = false;
    this.isStrikethrough = false;
    this.textAlign = 'left'; // 'left', 'center', 'right'
    this.textBg = true; // boolean or preset name ('dark', 'yellow', 'pink', 'blue', 'green', 'purple', 'white', 'none')

    // Selection & Manipulation State
    this.selectedActionIndex = -1;
    this.hoveredActionIndex = -1;
    this.hoveredResizeHandle = null;

    // Drag / Move State
    this.isDraggingElement = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragInitialAction = null;
    this.hasMovedElement = false;

    // Resize State
    this.isResizingElement = false;
    this.activeResizeHandle = null;
    this.resizeStartX = 0;
    this.resizeStartY = 0;
    this.resizeInitialAction = null;

    // History for Undo / Redo
    this.actions = [];
    this.redoStack = [];

    // Interaction State
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.currentPoints = [];
    this.activeTextElement = null;

    // Panning & Spacebar State
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;
    this.panScrollLeft = 0;
    this.panScrollTop = 0;
    this.isSpacePressed = false;

    // Crop Tool State
    this.cropBox = null; // { x, y, w, h } in base image coordinates
    this.isResizingCrop = false;
    this.isMovingCrop = false;
    this.isDrawingCrop = false;
    this.activeCropHandle = null;
    this.cropStartX = 0;
    this.cropStartY = 0;
    this.cropInitialBox = null;

    // Floating Crop Toolbar
    this.createCropToolbar();

    this.initEvents();
  }

  createCropToolbar() {
    this.cropToolbar = document.createElement('div');
    this.cropToolbar.className = 'annotation-crop-toolbar hidden';

    this.cropDimBadge = document.createElement('span');
    this.cropDimBadge.className = 'crop-dim-badge';
    this.cropDimBadge.textContent = '0 × 0 px';

    const btnGroup = document.createElement('div');
    btnGroup.className = 'crop-btn-group';

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'crop-action-btn crop-apply-btn';
    applyBtn.title = 'Apply Crop (Enter)';
    applyBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>Apply</span>
    `;
    applyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.applyCrop();
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'crop-action-btn crop-cancel-btn';
    cancelBtn.title = 'Cancel Crop (Esc)';
    cancelBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      <span>Cancel</span>
    `;
    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cancelCrop();
    });

    btnGroup.appendChild(applyBtn);
    btnGroup.appendChild(cancelBtn);

    this.cropToolbar.appendChild(this.cropDimBadge);
    this.cropToolbar.appendChild(btnGroup);

    this.wrapper.appendChild(this.cropToolbar);
  }

  /**
   * Load image from data URL or Image element
   */
  async loadImage(source) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.baseImage = img;
        this.imageWidth = img.naturalWidth || img.width;
        this.imageHeight = img.naturalHeight || img.height;

        this.actions = [];
        this.redoStack = [];
        this.stepCounter = 1;
        this.selectedActionIndex = -1;
        this.cropBox = null;
        if (this.cropToolbar) {
          this.cropToolbar.classList.add('hidden');
        }

        this.resizeCanvases(this.imageWidth, this.imageHeight);
        this.renderAll();
        this.fitToScreen();
        resolve();
      };
      img.onerror = (err) => reject(err);
      img.src = typeof source === 'string' ? source : source.src;
    });
  }

  resizeCanvases(width, height) {
    this.bgCanvas.width = width;
    this.bgCanvas.height = height;
    this.drawCanvas.width = width;
    this.drawCanvas.height = height;

    this.wrapper.style.width = `${width}px`;
    this.wrapper.style.height = `${height}px`;
  }

  setZoom(scale) {
    this.zoom = Math.max(0.05, Math.min(8, scale));
    this.wrapper.style.transform = `scale(${this.zoom})`;
    this.wrapper.style.transformOrigin = 'top left';
    if (this.currentTool === 'crop' && this.cropBox) {
      this.updateCropToolbar();
    }
  }

  fitToScreen() {
    if (!this.imageWidth || !this.imageHeight) return;
    const containerWidth = this.container.clientWidth - 48;
    const containerHeight = this.container.clientHeight - 48;

    if (containerWidth <= 0 || containerHeight <= 0) {
      this.setZoom(1);
      return;
    }

    const scaleX = containerWidth / this.imageWidth;
    const scaleY = containerHeight / this.imageHeight;
    const fitScale = Math.min(scaleX, scaleY);
    this.setZoom(fitScale);
  }

  fitWidth() {
    if (!this.imageWidth || !this.imageHeight) return;
    const containerWidth = this.container.clientWidth - 48;
    if (containerWidth <= 0) return;
    const scaleX = containerWidth / this.imageWidth;
    this.setZoom(scaleX);
  }

  fitHeight() {
    if (!this.imageWidth || !this.imageHeight) return;
    const containerHeight = this.container.clientHeight - 48;
    if (containerHeight <= 0) return;
    const scaleY = containerHeight / this.imageHeight;
    this.setZoom(scaleY);
  }

  setTool(tool) {
    this.commitActiveText();
    const prevTool = this.currentTool;
    this.currentTool = tool;
    if (tool !== 'select') {
      this.deselectAction();
    }

    if (tool === 'crop') {
      if (!this.cropBox && this.imageWidth && this.imageHeight) {
        const marginX = Math.max(10, Math.round(this.imageWidth * 0.05));
        const marginY = Math.max(10, Math.round(this.imageHeight * 0.05));
        this.cropBox = {
          x: marginX,
          y: marginY,
          w: Math.max(20, this.imageWidth - marginX * 2),
          h: Math.max(20, this.imageHeight - marginY * 2)
        };
      }
      if (this.cropToolbar) {
        this.cropToolbar.classList.remove('hidden');
        this.updateCropToolbar();
      }
    } else if (prevTool === 'crop') {
      this.cropBox = null;
      if (this.cropToolbar) {
        this.cropToolbar.classList.add('hidden');
      }
    }

    this.updateCursor();
    this.renderAll();

    if (tool === 'text') {
      if (typeof this.onTextModeActive === 'function') {
        this.onTextModeActive(this.getTextProperties());
      }
    }

    if (typeof this.onToolChange === 'function') {
      this.onToolChange(tool);
    }
  }

  setColor(color) {
    this.currentColor = color;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action) {
        action.color = color;
        this.renderAll();
      }
    }
    if (this.activeTextElement) {
      this.activeTextElement.color = color;
      this.activeTextElement.element.style.color = color;
      this.activeTextElement.element.style.borderColor = color;
    }
  }

  setStrokeWidth(width) {
    this.strokeWidth = width;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && action.type !== 'blur' && action.type !== 'text') {
        action.width = width;
        this.renderAll();
      }
    }
  }

  setLineStyle(style) {
    this.lineStyle = style;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && (action.type === 'arrow' || action.type === 'rect' || action.type === 'ellipse' || action.type === 'pen')) {
        action.lineStyle = style;
        this.renderAll();
      }
    }
  }

  setZoomMagnification(level) {
    this.currentZoomLevel = level;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && action.type === 'zoom') {
        action.zoomLevel = level;
        this.renderAll();
      }
    }
  }

  setZoomHasHandle(hasHandle) {
    this.zoomHasHandle = hasHandle;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && action.type === 'zoom') {
        action.hasHandle = hasHandle;
        this.renderAll();
      }
    }
  }

  setRedactMode(mode) {
    this.currentRedactMode = mode;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && action.type === 'blur') {
        action.redactMode = mode;
        this.renderAll();
      }
    }
  }

  toggleSpotlight(forceState) {
    this.isSpotlight = typeof forceState === 'boolean' ? forceState : !this.isSpotlight;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && (action.type === 'highlight' || action.type === 'spotlight')) {
        action.isSpotlight = this.isSpotlight;
        action.type = this.isSpotlight ? 'spotlight' : 'highlight';
        if (this.isSpotlight) {
          action.spotlightShape = this.currentSpotlightShape || 'circle';
          action.color = action.color === '#E5484D' ? '#FFFFFF' : (action.color || '#FFFFFF');
          action.width = Math.max(3, action.width || this.strokeWidth || 3);
        }
        this.renderAll();
      }
    }
    return this.isSpotlight;
  }

  setSpotlightShape(shape) {
    this.currentSpotlightShape = shape;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && (action.type === 'spotlight' || action.isSpotlight)) {
        action.spotlightShape = shape;
        this.renderAll();
      }
    }
  }

  setSpotlightMode(mode) {
    this.currentSpotlightMode = mode;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && (action.type === 'spotlight' || action.isSpotlight)) {
        action.spotlightMode = mode;
        this.renderAll();
      }
    }
  }

  setSpotlightRing(hasRing) {
    this.currentSpotlightRing = hasRing;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && (action.type === 'spotlight' || action.isSpotlight)) {
        action.hasRing = hasRing;
        this.renderAll();
      }
    }
  }

  // --- Text Styling Properties ---
  getTextProperties() {
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && action.type === 'text') {
        return {
          fontFamily: action.fontFamily || this.fontFamily,
          fontSize: action.fontSize || this.fontSize,
          isBold: action.isBold !== undefined ? action.isBold : this.isBold,
          isItalic: action.isItalic !== undefined ? action.isItalic : this.isItalic,
          isUnderline: action.isUnderline !== undefined ? action.isUnderline : this.isUnderline,
          isStrikethrough: action.isStrikethrough !== undefined ? action.isStrikethrough : this.isStrikethrough,
          textAlign: action.textAlign || this.textAlign,
          textBg: action.textBg !== undefined ? action.textBg : this.textBg,
          color: action.color || this.currentColor,
        };
      }
    }
    return {
      fontFamily: this.fontFamily,
      fontSize: this.fontSize,
      isBold: this.isBold,
      isItalic: this.isItalic,
      isUnderline: this.isUnderline,
      isStrikethrough: this.isStrikethrough,
      textAlign: this.textAlign,
      textBg: this.textBg,
      color: this.currentColor,
    };
  }

  setFontFamily(family) {
    this.fontFamily = family;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && action.type === 'text') {
        action.fontFamily = family;
        this.renderAll();
      }
    }
    if (this.activeTextElement) {
      this.activeTextElement.fontFamily = family;
      this.activeTextElement.element.style.fontFamily = family;
    }
  }

  setFontSize(size) {
    this.fontSize = parseInt(size, 10) || 18;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && action.type === 'text') {
        action.fontSize = this.fontSize;
        this.renderAll();
      }
    }
    if (this.activeTextElement) {
      this.activeTextElement.fontSize = this.fontSize;
      this.activeTextElement.element.style.fontSize = `${this.fontSize}px`;
    }
  }

  setBold(isBold) {
    this.isBold = isBold;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && action.type === 'text') {
        action.isBold = isBold;
        this.renderAll();
      }
    }
    if (this.activeTextElement) {
      this.activeTextElement.isBold = isBold;
      this.activeTextElement.element.style.fontWeight = isBold ? '700' : '400';
    }
  }

  setItalic(isItalic) {
    this.isItalic = isItalic;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && action.type === 'text') {
        action.isItalic = isItalic;
        this.renderAll();
      }
    }
    if (this.activeTextElement) {
      this.activeTextElement.isItalic = isItalic;
      this.activeTextElement.element.style.fontStyle = isItalic ? 'italic' : 'normal';
    }
  }

  setTextAlign(align) {
    this.textAlign = align;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && action.type === 'text') {
        action.textAlign = align;
        this.renderAll();
      }
    }
    if (this.activeTextElement) {
      this.activeTextElement.textAlign = align;
      this.activeTextElement.element.style.textAlign = align;
    }
  }

  getNotePreset(textBg, fallbackColor = '#ef4444') {
    if (textBg === false || textBg === 'none' || textBg === undefined) return null;
    const presets = {
      yellow: { bg: '#FEF08A', border: '#FDE047', text: '#713F12' },
      pink:   { bg: '#FBCFE8', border: '#F472B6', text: '#831843' },
      blue:   { bg: '#BFDBFE', border: '#93C5FD', text: '#1E3A8A' },
      green:  { bg: '#BBF7D0', border: '#86EFAC', text: '#14532D' },
      purple: { bg: '#E9D5FF', border: '#D8B4FE', text: '#581C87' },
      white:  { bg: '#FFFFFF', border: '#E2E8F0', text: '#0F172A' },
      dark:   { bg: 'rgba(12, 14, 18, 0.90)', border: fallbackColor, text: fallbackColor },
      badge:  { bg: 'rgba(12, 14, 18, 0.90)', border: fallbackColor, text: fallbackColor },
      true:   { bg: 'rgba(12, 14, 18, 0.90)', border: fallbackColor, text: fallbackColor }
    };
    return presets[textBg] || presets.dark;
  }

  setTextBg(hasBg) {
    this.textBg = hasBg;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && action.type === 'text') {
        action.textBg = hasBg;
        this.renderAll();
      }
    }
    if (this.activeTextElement) {
      this.activeTextElement.textBg = hasBg;
      const preset = this.getNotePreset(hasBg, this.currentColor);
      if (preset) {
        this.activeTextElement.element.style.background = preset.bg;
        this.activeTextElement.element.style.color = preset.text;
        this.activeTextElement.element.style.borderColor = preset.border;
      } else {
        this.activeTextElement.element.style.background = 'transparent';
        this.activeTextElement.element.style.color = this.currentColor;
        this.activeTextElement.element.style.borderColor = '1.5px dashed rgba(255, 255, 255, 0.4)';
      }
    }
  }

  setUnderline(isUnderline) {
    this.isUnderline = isUnderline;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && action.type === 'text') {
        action.isUnderline = isUnderline;
        this.renderAll();
      }
    }
    if (this.activeTextElement) {
      this.activeTextElement.isUnderline = isUnderline;
      this._updateActiveTextDecoration();
    }
  }

  setStrikethrough(isStrikethrough) {
    this.isStrikethrough = isStrikethrough;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && action.type === 'text') {
        action.isStrikethrough = isStrikethrough;
        this.renderAll();
      }
    }
    if (this.activeTextElement) {
      this.activeTextElement.isStrikethrough = isStrikethrough;
      this._updateActiveTextDecoration();
    }
  }

  _updateActiveTextDecoration() {
    if (!this.activeTextElement) return;
    const parts = [];
    if (this.activeTextElement.isUnderline) parts.push('underline');
    if (this.activeTextElement.isStrikethrough) parts.push('line-through');
    this.activeTextElement.element.style.textDecoration = parts.length ? parts.join(' ') : 'none';
  }

  setArrowStyle(style) {
    this.arrowStyle = style;
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      if (action && action.type === 'arrow') {
        action.arrowStyle = style;
        this.renderAll();
      }
    }
  }

  // --- Line Dash Utilities ---
  applyLineDash(ctx, style = this.lineStyle, width = this.strokeWidth) {
    if (style === 'dashed') {
      ctx.setLineDash([Math.max(6, width * 2), Math.max(4, width * 1.5)]);
    } else if (style === 'long-dash') {
      ctx.setLineDash([Math.max(14, width * 4), Math.max(6, width * 1.8)]);
    } else if (style === 'dotted') {
      ctx.setLineDash([Math.max(2, width * 0.75), Math.max(4, width * 1.25)]);
    } else if (style === 'dense-dot') {
      ctx.setLineDash([Math.max(2, width * 0.5), Math.max(2, width * 0.75)]);
    } else if (style === 'dash-dot') {
      ctx.setLineDash([Math.max(10, width * 3), Math.max(4, width * 1.2), Math.max(2, width * 0.75), Math.max(4, width * 1.2)]);
    } else {
      ctx.setLineDash([]);
    }
  }

  // --- Cursor Management ---
  updateCursor() {
    if (this.isPanning) {
      this.drawCanvas.style.cursor = 'grabbing';
    } else if (this.isSpacePressed) {
      this.drawCanvas.style.cursor = 'grab';
    } else if (this.currentTool === 'crop') {
      if (this.isResizingCrop && this.activeCropHandle) {
        this.drawCanvas.style.cursor = this.getCropCursor(this.activeCropHandle);
      } else if (this.isMovingCrop) {
        this.drawCanvas.style.cursor = 'move';
      } else if (this.isDrawingCrop) {
        this.drawCanvas.style.cursor = 'crosshair';
      } else {
        this.drawCanvas.style.cursor = 'default';
      }
    } else if (this.isResizingElement && this.activeResizeHandle) {
      this.drawCanvas.style.cursor = this.activeResizeHandle.cursor || 'crosshair';
    } else if (this.currentTool === 'select') {
      if (this.isDraggingElement) {
        this.drawCanvas.style.cursor = 'grabbing';
      } else if (this.hoveredResizeHandle) {
        this.drawCanvas.style.cursor = this.hoveredResizeHandle.cursor || 'crosshair';
      } else if (this.hoveredActionIndex !== -1 || this.selectedActionIndex !== -1) {
        this.drawCanvas.style.cursor = 'move';
      } else {
        this.drawCanvas.style.cursor = 'default';
      }
    } else {
      this.drawCanvas.style.cursor = this.getCursorForTool(this.currentTool);
    }
  }

  getCropCursor(handle) {
    switch (handle) {
      case 'nw':
      case 'se':
        return 'nwse-resize';
      case 'ne':
      case 'sw':
        return 'nesw-resize';
      case 'n':
      case 's':
        return 'ns-resize';
      case 'w':
      case 'e':
        return 'ew-resize';
      case 'inside':
        return 'move';
      case 'outside':
      default:
        return 'crosshair';
    }
  }

  getCursorForTool(tool) {
    switch (tool) {
      case 'select':
        return 'default';
      case 'crop':
      case 'pen':
      case 'arrow':
      case 'rect':
      case 'ellipse':
      case 'highlight':
      case 'blur':
      case 'step':
      case 'stamp':
      case 'zoom':
      case 'spotlight':
        return 'crosshair';
      case 'text':
        return 'text';
      default:
        return 'default';
    }
  }

  // --- Coordinate Mapping ---
  getCanvasCoords(e) {
    const rect = this.drawCanvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;

    const x = (clientX - rect.left) * (this.drawCanvas.width / rect.width);
    const y = (clientY - rect.top) * (this.drawCanvas.height / rect.height);
    return { x: Math.round(x), y: Math.round(y) };
  }

  // --- Hit Testing & Selection ---
  pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  hitTestAction(x, y) {
    // Search top-to-bottom
    for (let i = this.actions.length - 1; i >= 0; i--) {
      const action = this.actions[i];
      if (action.type === 'crop') continue;
      if (this.isPointInsideAction(x, y, action)) {
        return i;
      }
    }
    return -1;
  }

  isPointInsideAction(px, py, action) {
    switch (action.type) {
      case 'arrow': {
        if (action.arrowStyle === 'curved' || action.arrowStyle === 'curved-alt') {
          const isAlt = action.arrowStyle === 'curved-alt';
          const dx = action.x2 - action.x1;
          const dy = action.y2 - action.y1;
          const dist = Math.hypot(dx, dy);
          const perpX = -dy / (dist || 1);
          const perpY = dx / (dist || 1);
          const bow = Math.min(80, Math.max(25, dist * 0.22)) * (isAlt ? -1 : 1);
          const cpX = (action.x1 + action.x2) / 2 + perpX * bow;
          const cpY = (action.y1 + action.y2) / 2 + perpY * bow;
          const d1 = this.pointToSegmentDistance(px, py, action.x1, action.y1, cpX, cpY);
          const d2 = this.pointToSegmentDistance(px, py, cpX, cpY, action.x2, action.y2);
          const chord = this.pointToSegmentDistance(px, py, action.x1, action.y1, action.x2, action.y2);
          const threshold = Math.max(14, (action.width || 4) + 10);
          return Math.min(d1, d2, chord) <= threshold;
        }
        const lineDist = this.pointToSegmentDistance(px, py, action.x1, action.y1, action.x2, action.y2);
        const threshold = Math.max(12, (action.width || 4) + 8);
        return lineDist <= threshold;
      }

      case 'rect': {
        const pad = Math.max(8, (action.width || 4));
        return px >= action.x - pad &&
               px <= action.x + action.w + pad &&
               py >= action.y - pad &&
               py <= action.y + action.h + pad;
      }

      case 'ellipse': {
        const dx = (px - action.cx) / (action.rx + 8);
        const dy = (py - action.cy) / (action.ry + 8);
        return (dx * dx + dy * dy) <= 1.2;
      }

      case 'highlight': {
        return px >= action.x &&
               px <= action.x + action.w &&
               py >= action.y &&
               py <= action.y + action.h;
      }

      case 'spotlight': {
        if (action.spotlightShape !== 'rect') {
          const cx = action.x + action.w / 2;
          const cy = action.y + action.h / 2;
          const rx = action.w / 2 + 6;
          const ry = action.h / 2 + 6;
          const dx = (px - cx) / rx;
          const dy = (py - cy) / ry;
          return (dx * dx + dy * dy) <= 1.0;
        }
        return px >= action.x &&
               px <= action.x + action.w &&
               py >= action.y &&
               py <= action.y + action.h;
      }

      case 'blur': {
        return px >= action.x &&
               px <= action.x + action.w &&
               py >= action.y &&
               py <= action.y + action.h;
      }

      case 'text': {
        const bbox = this.getTextBoundingBox(action);
        return px >= bbox.x && px <= bbox.x + bbox.w &&
               py >= bbox.y && py <= bbox.y + bbox.h;
      }

      case 'step': {
        const dist = Math.hypot(px - action.x, py - action.y);
        return dist <= (action.radius || 14) + 6;
      }

      case 'stamp': {
        const r = (action.size || 32) / 2;
        const dist = Math.hypot(px - action.x, py - action.y);
        return dist <= r + 6;
      }

      case 'zoom': {
        const r = action.radius || 80;
        const dist = Math.hypot(px - action.cx, py - action.cy);
        if (dist <= r + 6) return true;
        if (action.hasHandle !== false) {
          const angle = action.handleAngle ?? (Math.PI / 4);
          const hLength = action.handleLength ?? Math.max(45, Math.round(r * 0.65));
          const hWidth = action.handleWidth ?? Math.max(12, Math.min(22, Math.round(r * 0.16)));
          const hStartX = action.cx + (r - 2) * Math.cos(angle);
          const hStartY = action.cy + (r - 2) * Math.sin(angle);
          const hEndX = action.cx + (r + hLength) * Math.cos(angle);
          const hEndY = action.cy + (r + hLength) * Math.sin(angle);
          if (this.pointToSegmentDistance(px, py, hStartX, hStartY, hEndX, hEndY) <= hWidth / 2 + 6) {
            return true;
          }
        }
        return false;
      }

      case 'pen': {
        if (!action.points || action.points.length < 2) return false;
        const pad = Math.max(10, (action.width || 4) + 6);
        for (let j = 0; j < action.points.length - 1; j++) {
          const p1 = action.points[j];
          const p2 = action.points[j + 1];
          if (this.pointToSegmentDistance(px, py, p1.x, p1.y, p2.x, p2.y) <= pad) {
            return true;
          }
        }
        return false;
      }
    }
    return false;
  }

  getTextBoundingBox(action) {
    const fontSize = action.fontSize || 18;
    const fontFamily = action.fontFamily || "'Inter', -apple-system, sans-serif";
    const isBold = action.isBold !== undefined ? action.isBold : true;
    const isItalic = action.isItalic ? 'italic ' : '';
    const weight = isBold ? 'bold ' : '';

    this.drawCtx.font = `${isItalic}${weight}${fontSize}px ${fontFamily}`;
    const lines = (action.text || '').split('\n');
    const lineHeight = Math.round(fontSize * 1.25);
    let maxLineWidth = 0;

    for (const line of lines) {
      const metrics = this.drawCtx.measureText(line || ' ');
      if (metrics.width > maxLineWidth) {
        maxLineWidth = metrics.width;
      }
    }

    const padding = 6;
    const bgWidth = Math.max(30, maxLineWidth + padding * 2);
    const bgHeight = Math.max(20, lines.length * lineHeight + padding * 2);

    let startX = action.x - padding;
    if (action.textAlign === 'center') {
      startX = action.x - bgWidth / 2;
    } else if (action.textAlign === 'right') {
      startX = action.x - bgWidth + padding;
    }

    return {
      x: startX,
      y: action.y - padding,
      w: bgWidth,
      h: bgHeight,
    };
  }

  getActionBoundingBox(action) {
    switch (action.type) {
      case 'arrow': {
        if (action.arrowStyle === 'curved' || action.arrowStyle === 'curved-alt') {
          const isAlt = action.arrowStyle === 'curved-alt';
          const dx = action.x2 - action.x1;
          const dy = action.y2 - action.y1;
          const dist = Math.hypot(dx, dy);
          const perpX = -dy / (dist || 1);
          const perpY = dx / (dist || 1);
          const bow = Math.min(80, Math.max(25, dist * 0.22)) * (isAlt ? -1 : 1);
          const cpX = (action.x1 + action.x2) / 2 + perpX * bow;
          const cpY = (action.y1 + action.y2) / 2 + perpY * bow;
          const minX = Math.min(action.x1, action.x2, cpX);
          const maxX = Math.max(action.x1, action.x2, cpX);
          const minY = Math.min(action.y1, action.y2, cpY);
          const maxY = Math.max(action.y1, action.y2, cpY);
          const pad = Math.max(16, (action.width || 4) * 2);
          return { x: minX - pad, y: minY - pad, w: (maxX - minX) + pad * 2, h: (maxY - minY) + pad * 2 };
        }
        const minX = Math.min(action.x1, action.x2);
        const maxX = Math.max(action.x1, action.x2);
        const minY = Math.min(action.y1, action.y2);
        const maxY = Math.max(action.y1, action.y2);
        const pad = Math.max(12, (action.width || 4) * 2);
        return { x: minX - pad, y: minY - pad, w: (maxX - minX) + pad * 2, h: (maxY - minY) + pad * 2 };
      }
      case 'rect':
      case 'highlight':
      case 'blur':
      case 'spotlight':
        return { x: action.x - 4, y: action.y - 4, w: action.w + 8, h: action.h + 8 };
      case 'ellipse':
        return { x: action.cx - action.rx - 4, y: action.cy - action.ry - 4, w: action.rx * 2 + 8, h: action.ry * 2 + 8 };
      case 'text':
        return this.getTextBoundingBox(action);
      case 'step': {
        const r = action.radius || 14;
        return { x: action.x - r - 4, y: action.y - r - 4, w: (r + 4) * 2, h: (r + 4) * 2 };
      }
      case 'stamp': {
        const r = (action.size || 32) / 2;
        return { x: action.x - r - 4, y: action.y - r - 4, w: (r + 4) * 2, h: (r + 4) * 2 };
      }
      case 'zoom': {
        const r = (action.radius || 80) + 6;
        let minX = action.cx - r;
        let maxX = action.cx + r;
        let minY = action.cy - r;
        let maxY = action.cy + r;
        if (action.hasHandle !== false) {
          const angle = action.handleAngle ?? (Math.PI / 4);
          const hLength = action.handleLength ?? Math.max(45, Math.round((action.radius || 80) * 0.65));
          const hWidth = action.handleWidth ?? Math.max(12, Math.min(22, Math.round((action.radius || 80) * 0.16)));
          const hEndX = action.cx + ((action.radius || 80) + hLength) * Math.cos(angle);
          const hEndY = action.cy + ((action.radius || 80) + hLength) * Math.sin(angle);
          minX = Math.min(minX, hEndX - hWidth);
          maxX = Math.max(maxX, hEndX + hWidth);
          minY = Math.min(minY, hEndY - hWidth);
          maxY = Math.max(maxY, hEndY + hWidth);
        }
        return { x: minX - 4, y: minY - 4, w: (maxX - minX) + 8, h: (maxY - minY) + 8 };
      }
      case 'pen': {
        if (!action.points || action.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const p of action.points) {
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
        }
        const pad = Math.max(8, action.width || 4);
        return { x: minX - pad, y: minY - pad, w: (maxX - minX) + pad * 2, h: (maxY - minY) + pad * 2 };
      }
    }
    return null;
  }

  // --- Resize Handles & Scaling ---
  getResizeHandles(action) {
    if (!action) return [];

    switch (action.type) {
      case 'arrow':
        return [
          { id: 'start', x: action.x1, y: action.y1, cursor: 'crosshair' },
          { id: 'end', x: action.x2, y: action.y2, cursor: 'crosshair' },
        ];

      case 'rect':
      case 'highlight':
      case 'blur':
      case 'spotlight':
        return [
          { id: 'nw', x: action.x, y: action.y, cursor: 'nwse-resize' },
          { id: 'ne', x: action.x + action.w, y: action.y, cursor: 'nesw-resize' },
          { id: 'se', x: action.x + action.w, y: action.y + action.h, cursor: 'nwse-resize' },
          { id: 'sw', x: action.x, y: action.y + action.h, cursor: 'nesw-resize' },
        ];

      case 'ellipse':
        return [
          { id: 'nw', x: action.cx - action.rx, y: action.cy - action.ry, cursor: 'nwse-resize' },
          { id: 'ne', x: action.cx + action.rx, y: action.cy - action.ry, cursor: 'nesw-resize' },
          { id: 'se', x: action.cx + action.rx, y: action.cy + action.ry, cursor: 'nwse-resize' },
          { id: 'sw', x: action.cx - action.rx, y: action.cy + action.ry, cursor: 'nesw-resize' },
        ];

      case 'text': {
        const bbox = this.getTextBoundingBox(action);
        return [
          { id: 'nw', x: bbox.x, y: bbox.y, cursor: 'nwse-resize' },
          { id: 'ne', x: bbox.x + bbox.w, y: bbox.y, cursor: 'nesw-resize' },
          { id: 'se', x: bbox.x + bbox.w, y: bbox.y + bbox.h, cursor: 'nwse-resize' },
          { id: 'sw', x: bbox.x, y: bbox.y + bbox.h, cursor: 'nesw-resize' },
        ];
      }

      case 'step': {
        const r = action.radius || 14;
        const offset = r * 0.707;
        return [
          { id: 'se', x: action.x + offset, y: action.y + offset, cursor: 'nwse-resize' },
          { id: 'nw', x: action.x - offset, y: action.y - offset, cursor: 'nwse-resize' },
        ];
      }

      case 'stamp': {
        const r = (action.size || 32) / 2;
        const offset = r * 0.707;
        return [
          { id: 'se', x: action.x + offset, y: action.y + offset, cursor: 'nwse-resize' },
          { id: 'nw', x: action.x - offset, y: action.y - offset, cursor: 'nwse-resize' },
        ];
      }

      case 'zoom': {
        const r = action.radius || 80;
        const offset = r * 0.707;
        const handles = [
          { id: 'zoom-nw', x: action.cx - offset, y: action.cy - offset, cursor: 'nwse-resize' },
          { id: 'zoom-ne', x: action.cx + offset, y: action.cy - offset, cursor: 'nesw-resize' },
          { id: 'zoom-se', x: action.cx + offset, y: action.cy + offset, cursor: 'nwse-resize' },
          { id: 'zoom-sw', x: action.cx - offset, y: action.cy + offset, cursor: 'nesw-resize' },
        ];
        if (action.hasHandle !== false) {
          const angle = action.handleAngle ?? (Math.PI / 4);
          const hLength = action.handleLength ?? Math.max(45, Math.round(r * 0.65));
          const hEndX = action.cx + (r + hLength) * Math.cos(angle);
          const hEndY = action.cy + (r + hLength) * Math.sin(angle);
          handles.push({ id: 'handle-tip', x: hEndX, y: hEndY, cursor: 'grab' });
        }
        return handles;
      }

      case 'pen': {
        const bbox = this.getActionBoundingBox(action);
        if (!bbox) return [];
        return [
          { id: 'nw', x: bbox.x, y: bbox.y, cursor: 'nwse-resize' },
          { id: 'ne', x: bbox.x + bbox.w, y: bbox.y, cursor: 'nesw-resize' },
          { id: 'se', x: bbox.x + bbox.w, y: bbox.y + bbox.h, cursor: 'nwse-resize' },
          { id: 'sw', x: bbox.x, y: bbox.y + bbox.h, cursor: 'nesw-resize' },
        ];
      }
    }
    return [];
  }

  hitTestResizeHandle(px, py, action) {
    const handles = this.getResizeHandles(action);
    const tolerance = 9;

    for (const h of handles) {
      if (Math.hypot(px - h.x, py - h.y) <= tolerance) {
        return h;
      }
    }
    return null;
  }

  resizeAction(target, initial, handleId, dx, dy) {
    switch (target.type) {
      case 'arrow':
        if (handleId === 'start') {
          target.x1 = initial.x1 + dx;
          target.y1 = initial.y1 + dy;
        } else if (handleId === 'end') {
          target.x2 = initial.x2 + dx;
          target.y2 = initial.y2 + dy;
        }
        break;

      case 'rect':
      case 'highlight':
      case 'blur':
      case 'spotlight': {
        let x = initial.x;
        let y = initial.y;
        let w = initial.w;
        let h = initial.h;

        if (handleId === 'nw') {
          x = initial.x + dx;
          y = initial.y + dy;
          w = initial.w - dx;
          h = initial.h - dy;
        } else if (handleId === 'ne') {
          y = initial.y + dy;
          w = initial.w + dx;
          h = initial.h - dy;
        } else if (handleId === 'se') {
          w = initial.w + dx;
          h = initial.h + dy;
        } else if (handleId === 'sw') {
          x = initial.x + dx;
          w = initial.w - dx;
          h = initial.h + dy;
        }

        if (w < 8) { x = initial.x; w = 8; }
        if (h < 8) { y = initial.y; h = 8; }

        target.x = x;
        target.y = y;
        target.w = w;
        target.h = h;
        break;
      }

      case 'ellipse': {
        let rx = initial.rx;
        let ry = initial.ry;

        if (handleId === 'se') {
          rx = initial.rx + dx;
          ry = initial.ry + dy;
        } else if (handleId === 'nw') {
          rx = initial.rx - dx;
          ry = initial.ry - dy;
        } else if (handleId === 'ne') {
          rx = initial.rx + dx;
          ry = initial.ry - dy;
        } else if (handleId === 'sw') {
          rx = initial.rx - dx;
          ry = initial.ry + dy;
        }

        target.rx = Math.max(8, rx);
        target.ry = Math.max(8, ry);
        break;
      }

      case 'text': {
        const delta = (handleId === 'se' || handleId === 'sw') ? (dx + dy) / 2 : -(dx + dy) / 2;
        const scale = 1 + delta / 80;
        const newFontSize = Math.max(10, Math.min(96, Math.round(initial.fontSize * scale)));
        target.fontSize = newFontSize;
        this.fontSize = newFontSize;
        if (typeof this.onTextModeActive === 'function') {
          this.onTextModeActive(this.getTextProperties());
        }
        break;
      }

      case 'step':
      case 'stamp': {
        const delta = (handleId === 'se') ? (dx + dy) / 2 : -(dx + dy) / 2;
        if (target.type === 'step') {
          target.radius = Math.max(10, Math.min(60, Math.round((initial.radius || 14) + delta)));
        } else {
          target.size = Math.max(16, Math.min(160, Math.round((initial.size || 32) + delta * 1.5)));
        }
        break;
      }

      case 'zoom': {
        if (handleId === 'handle-tip') {
          const initAngle = initial.handleAngle ?? (Math.PI / 4);
          const initR = initial.radius || 80;
          const initHLen = initial.handleLength ?? Math.max(45, Math.round(initR * 0.65));
          const curEndX = (initial.cx + (initR + initHLen) * Math.cos(initAngle)) + dx;
          const curEndY = (initial.cy + (initR + initHLen) * Math.sin(initAngle)) + dy;
          target.handleAngle = Math.atan2(curEndY - target.cy, curEndX - target.cx);
        } else {
          let delta = 0;
          if (handleId === 'zoom-se') delta = (dx + dy) / 2;
          else if (handleId === 'zoom-nw') delta = -(dx + dy) / 2;
          else if (handleId === 'zoom-ne') delta = (dx - dy) / 2;
          else if (handleId === 'zoom-sw') delta = (-dx + dy) / 2;
          target.radius = Math.max(25, Math.min(800, Math.round((initial.radius || 80) + delta)));
        }
        break;
      }

      case 'pen': {
        const initBox = this.getActionBoundingBox(initial);
        if (!initBox || initBox.w === 0 || initBox.h === 0) break;

        let scaleX = 1;
        let scaleY = 1;
        if (handleId === 'se') {
          scaleX = (initBox.w + dx) / initBox.w;
          scaleY = (initBox.h + dy) / initBox.h;
        } else if (handleId === 'nw') {
          scaleX = (initBox.w - dx) / initBox.w;
          scaleY = (initBox.h - dy) / initBox.h;
        }

        scaleX = Math.max(0.2, scaleX);
        scaleY = Math.max(0.2, scaleY);

        target.points = initial.points.map(p => ({
          x: initBox.x + (p.x - initBox.x) * scaleX,
          y: initBox.y + (p.y - initBox.y) * scaleY,
        }));
        break;
      }
    }
  }

  selectAction(index) {
    this.selectedActionIndex = index;
    const action = (index >= 0 && index < this.actions.length) ? this.actions[index] : null;
    if (action && action.type === 'text') {
      if (typeof this.onTextModeActive === 'function') {
        this.onTextModeActive(this.getTextProperties());
      }
    }
    if (typeof this.onSelectionChange === 'function') {
      this.onSelectionChange(action, index);
    }
    this.renderAll();
  }

  deselectAction() {
    if (this.selectedActionIndex !== -1) {
      this.selectedActionIndex = -1;
      this.hoveredResizeHandle = null;
      if (typeof this.onSelectionChange === 'function') {
        this.onSelectionChange(null, -1);
      }
      this.renderAll();
    }
  }

  deleteSelectedAction() {
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const deleted = this.actions.splice(this.selectedActionIndex, 1)[0];
      this.redoStack = [];
      this.selectedActionIndex = -1;
      if (typeof this.onSelectionChange === 'function') {
        this.onSelectionChange(null, -1);
      }
      this.renderAll();
      return deleted;
    }
    return null;
  }

  duplicateSelectedAction() {
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const original = this.actions[this.selectedActionIndex];
      const clone = JSON.parse(JSON.stringify(original));
      this.translateAction(clone, 20, 20);
      this.actions.push(clone);
      this.redoStack = [];
      this.selectedActionIndex = this.actions.length - 1;
      if (typeof this.onSelectionChange === 'function') {
        this.onSelectionChange(clone, this.selectedActionIndex);
      }
      this.renderAll();
      return clone;
    }
    return null;
  }

  nudgeSelectedAction(dx, dy) {
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      const action = this.actions[this.selectedActionIndex];
      this.translateAction(action, dx, dy);
      this.renderAll();
    }
  }

  translateAction(action, dx, dy) {
    switch (action.type) {
      case 'arrow':
        action.x1 += dx;
        action.y1 += dy;
        action.x2 += dx;
        action.y2 += dy;
        break;
      case 'rect':
      case 'highlight':
      case 'blur':
      case 'spotlight':
      case 'text':
      case 'step':
      case 'stamp':
        action.x += dx;
        action.y += dy;
        break;
      case 'ellipse':
      case 'zoom':
        action.cx += dx;
        action.cy += dy;
        break;
      case 'pen':
        if (action.points) {
          for (const p of action.points) {
            p.x += dx;
            p.y += dy;
          }
        }
        break;
    }
  }

  cloneAction(action) {
    return JSON.parse(JSON.stringify(action));
  }

  // --- Event Bindings ---
  initEvents() {
    const onMouseDown = (e) => {
      if (!this.baseImage) return;
      if (e.button !== 0 && e.type === 'mousedown') return;

      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
      const { x, y } = this.getCanvasCoords(e);

      // Handle spacebar pan
      if (this.isSpacePressed) {
        this.isPanning = true;
        this.panStartX = clientX;
        this.panStartY = clientY;
        this.panScrollLeft = this.container.scrollLeft;
        this.panScrollTop = this.container.scrollTop;
        this.updateCursor();
        return;
      }

      // Handle CROP tool interactions
      if (this.currentTool === 'crop') {
        const handle = this.hitTestCropHandle(x, y);
        if (handle && handle !== 'inside' && handle !== 'outside') {
          this.isResizingCrop = true;
          this.activeCropHandle = handle;
          this.cropStartX = x;
          this.cropStartY = y;
          this.cropInitialBox = { ...this.cropBox };
          this.drawCanvas.style.cursor = this.getCropCursor(handle);
          return;
        } else if (handle === 'inside') {
          this.isMovingCrop = true;
          this.cropStartX = x;
          this.cropStartY = y;
          this.cropInitialBox = { ...this.cropBox };
          this.drawCanvas.style.cursor = 'move';
          return;
        } else {
          // Drawing new crop box
          this.isDrawingCrop = true;
          this.cropStartX = x;
          this.cropStartY = y;
          this.cropBox = { x, y, w: 0, h: 0 };
          if (this.cropToolbar) this.cropToolbar.classList.add('hidden');
          this.renderAll();
          return;
        }
      }

      // 1. Check if clicking a RESIZE HANDLE on active selection (Only in SELECT mode)
      if (this.currentTool === 'select' && this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
        const selectedAction = this.actions[this.selectedActionIndex];
        const handle = this.hitTestResizeHandle(x, y, selectedAction);
        if (handle) {
          this.isResizingElement = true;
          this.activeResizeHandle = handle;
          this.resizeStartX = x;
          this.resizeStartY = y;
          this.resizeInitialAction = this.cloneAction(selectedAction);
          this.updateCursor();
          return;
        }
      }

      // 2. Handle SELECT tool
      if (this.currentTool === 'select') {
        const hitIdx = this.hitTestAction(x, y);
        if (hitIdx !== -1) {
          this.selectAction(hitIdx);
          this.isDraggingElement = true;
          this.dragStartX = x;
          this.dragStartY = y;
          this.dragInitialAction = this.cloneAction(this.actions[hitIdx]);
          this.hasMovedElement = false;
          this.updateCursor();
          return;
        } else {
          this.deselectAction();
          // Pan when clicking empty area in select mode
          this.isPanning = true;
          this.panStartX = clientX;
          this.panStartY = clientY;
          this.panScrollLeft = this.container.scrollLeft;
          this.panScrollTop = this.container.scrollTop;
          this.updateCursor();
          return;
        }
      }

      // If switching to drawing tools with an existing selection, deselect without re-rendering unnecessarily
      if (this.selectedActionIndex !== -1) {
        this.deselectAction();
      }

      // 3. Handle TEXT tool
      if (this.currentTool === 'text') {
        // If clicked on an existing text note, select it and focus editor
        const hitIdx = this.hitTestAction(x, y);
        if (hitIdx !== -1 && this.actions[hitIdx].type === 'text') {
          this.selectAction(hitIdx);
          return;
        }

        this.handleTextClick(x, y);
        return;
      }

      // 4. Handle STEP badge
      if (this.currentTool === 'step') {
        this.addStepBadge(x, y);
        return;
      }

      // 5. Handle STAMP callout
      if (this.currentTool === 'stamp') {
        this.addStampBadge(x, y);
        return;
      }

      // Standard shape/pen drawing
      this.isDrawing = true;
      this.startX = x;
      this.startY = y;

      if (this.currentTool === 'pen') {
        this.currentPoints = [{ x, y }];
      }
    };

    const onMouseMove = (e) => {
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;

      // Panning container
      if (this.isPanning) {
        this.container.scrollLeft = this.panScrollLeft - (clientX - this.panStartX);
        this.container.scrollTop = this.panScrollTop - (clientY - this.panStartY);
        return;
      }

      const { x, y } = this.getCanvasCoords(e);

      // Handle CROP tool drag / resize / hover
      if (this.currentTool === 'crop') {
        if (this.isResizingCrop && this.activeCropHandle && this.cropInitialBox) {
          const dx = x - this.cropStartX;
          const dy = y - this.cropStartY;
          this.resizeCropBox(this.activeCropHandle, dx, dy);
          this.renderAll();
          return;
        }

        if (this.isMovingCrop && this.cropInitialBox) {
          const dx = x - this.cropStartX;
          const dy = y - this.cropStartY;
          let newX = this.cropInitialBox.x + dx;
          let newY = this.cropInitialBox.y + dy;
          newX = Math.max(0, Math.min(this.imageWidth - this.cropInitialBox.w, newX));
          newY = Math.max(0, Math.min(this.imageHeight - this.cropInitialBox.h, newY));
          this.cropBox.x = Math.round(newX);
          this.cropBox.y = Math.round(newY);
          this.renderAll();
          return;
        }

        if (this.isDrawingCrop) {
          const minX = Math.max(0, Math.min(this.cropStartX, x));
          const minY = Math.max(0, Math.min(this.cropStartY, y));
          const maxX = Math.min(this.imageWidth, Math.max(this.cropStartX, x));
          const maxY = Math.min(this.imageHeight, Math.max(this.cropStartY, y));
          this.cropBox = {
            x: Math.round(minX),
            y: Math.round(minY),
            w: Math.round(maxX - minX),
            h: Math.round(maxY - minY)
          };
          this.renderAll();
          return;
        }

        // Idle hover in crop mode: update cursor based on handle hit test
        const handle = this.hitTestCropHandle(x, y);
        this.drawCanvas.style.cursor = this.getCropCursor(handle);
        return;
      }

      // Resizing an annotation element
      if (this.isResizingElement && this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
        const dx = x - this.resizeStartX;
        const dy = y - this.resizeStartY;
        const target = this.actions[this.selectedActionIndex];
        const initial = this.resizeInitialAction;

        Object.assign(target, this.cloneAction(initial));
        this.resizeAction(target, initial, this.activeResizeHandle.id, dx, dy);
        this.renderAll();
        return;
      }

      // Dragging / Moving an annotation element
      if (this.isDraggingElement && this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
        const dx = x - this.dragStartX;
        const dy = y - this.dragStartY;
        if (Math.hypot(dx, dy) > 2) {
          this.hasMovedElement = true;
          const target = this.actions[this.selectedActionIndex];
          const initial = this.dragInitialAction;

          // Restore to initial state then translate
          Object.assign(target, this.cloneAction(initial));
          this.translateAction(target, dx, dy);
          this.renderAll();
        }
        return;
      }

      // Hover feedback in Select mode
      if (this.currentTool === 'select' && !this.isDrawing) {
        if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
          const handle = this.hitTestResizeHandle(x, y, this.actions[this.selectedActionIndex]);
          if (handle !== this.hoveredResizeHandle) {
            this.hoveredResizeHandle = handle;
            this.updateCursor();
          }
          if (handle) return;
        }

        const hitIdx = this.hitTestAction(x, y);
        if (hitIdx !== this.hoveredActionIndex) {
          this.hoveredActionIndex = hitIdx;
          this.updateCursor();
        }
        return;
      }

      // Realtime Drawing Previews
      if (!this.isDrawing || !this.baseImage) return;

      if (this.currentTool === 'pen') {
        this.currentPoints.push({ x, y });
        this.renderPreviewPen();
      } else {
        this.renderPreviewShape(this.startX, this.startY, x, y);
      }
    };

    const onMouseUp = (e) => {
      if (this.isPanning) {
        this.isPanning = false;
        this.updateCursor();
        return;
      }

      if (this.currentTool === 'crop') {
        if (this.isResizingCrop || this.isMovingCrop || this.isDrawingCrop) {
          this.isResizingCrop = false;
          this.isMovingCrop = false;
          this.isDrawingCrop = false;
          this.activeCropHandle = null;
          this.cropInitialBox = null;

          // If drawn crop box was too small, reset to minimum safe box
          if (!this.cropBox || this.cropBox.w < 20 || this.cropBox.h < 20) {
            const marginX = Math.max(10, Math.round(this.imageWidth * 0.05));
            const marginY = Math.max(10, Math.round(this.imageHeight * 0.05));
            this.cropBox = {
              x: marginX,
              y: marginY,
              w: Math.max(20, this.imageWidth - marginX * 2),
              h: Math.max(20, this.imageHeight - marginY * 2)
            };
          }

          if (this.cropToolbar) {
            this.cropToolbar.classList.remove('hidden');
          }
          this.renderAll();
          this.updateCursor();
          return;
        }
      }

      if (this.isResizingElement) {
        this.isResizingElement = false;
        this.activeResizeHandle = null;
        this.resizeInitialAction = null;
        this.redoStack = [];
        this.updateCursor();
        return;
      }

      if (this.isDraggingElement) {
        this.isDraggingElement = false;
        if (this.hasMovedElement && this.dragInitialAction) {
          this.redoStack = [];
        }
        this.dragInitialAction = null;
        this.updateCursor();
        return;
      }

      if (!this.isDrawing) return;
      this.isDrawing = false;
      const { x, y } = this.getCanvasCoords(e);
      this.commitAction(x, y);
    };

    const onDoubleClick = (e) => {
      const { x, y } = this.getCanvasCoords(e);
      const hitIdx = this.hitTestAction(x, y);
      if (hitIdx !== -1 && this.actions[hitIdx].type === 'text') {
        this.editExistingText(hitIdx);
      }
    };

    this.drawCanvas.addEventListener('mousedown', onMouseDown);
    this.drawCanvas.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch support
    this.drawCanvas.addEventListener('touchstart', onMouseDown, { passive: false });
    window.addEventListener('touchmove', onMouseMove, { passive: false });
    window.addEventListener('touchend', onMouseUp);

    // Mouse wheel / trackpad zoom with Ctrl key
    this.container.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        this.setZoom(this.zoom + delta);
      }
    }, { passive: false });

    // Helper: Is editing an input or text area
    const isEditingInput = () => {
      const active = document.activeElement;
      if (!active) return false;
      const tag = active.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || active.isContentEditable;
    };

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (this.activeTextElement) return; // Don't intercept while typing text in studio text element

      // Handle Spacebar pan
      if (e.code === 'Space' && !isEditingInput()) {
        if (!this.isSpacePressed) {
          this.isSpacePressed = true;
          this.updateCursor();
        }
        if (e.target === document.body || e.target === this.drawCanvas) {
          e.preventDefault();
        }
        return;
      }

      // Delete key deletes selected action
      if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedActionIndex !== -1 && !isEditingInput()) {
        this.deleteSelectedAction();
        e.preventDefault();
        return;
      }

      // Arrow keys nudge selected element
      if (this.selectedActionIndex !== -1 && !isEditingInput() && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const step = e.shiftKey ? 10 : 2;
        if (e.key === 'ArrowUp') this.nudgeSelectedAction(0, -step);
        else if (e.key === 'ArrowDown') this.nudgeSelectedAction(0, step);
        else if (e.key === 'ArrowLeft') this.nudgeSelectedAction(-step, 0);
        else if (e.key === 'ArrowRight') this.nudgeSelectedAction(step, 0);
        e.preventDefault();
        return;
      }

      // Duplicate element shortcut: Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && this.selectedActionIndex !== -1 && !isEditingInput()) {
        this.duplicateSelectedAction();
        e.preventDefault();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        this.redo();
        e.preventDefault();
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && !isEditingInput()) {
        if (this.currentTool === 'crop') {
          if (e.key === 'Enter') {
            this.applyCrop();
            e.preventDefault();
            return;
          } else if (e.key === 'Escape') {
            this.cancelCrop();
            e.preventDefault();
            return;
          }
        }

        const k = e.key.toLowerCase();
        if (k === 'v') { this.setTool('select'); }
        else if (k === 'k' || k === 'x') { this.setTool(this.currentTool === 'crop' ? 'select' : 'crop'); }
        else if (k === 'a') { this.setTool('arrow'); }
        else if (k === 'r' && !e.shiftKey) { this.setTool('rect'); }
        else if (k === 'c') { this.setTool('ellipse'); }
        else if (k === 'p') { this.setTool('pen'); }
        else if (k === 't') { this.setTool('text'); }
        else if (k === 'h' && !e.shiftKey) { this.setTool('highlight'); }
        else if (k === 'f') { this.setTool('spotlight'); }
        else if (k === 'b') { this.setTool('blur'); }
        else if (k === 'z' && !e.ctrlKey && !e.metaKey) { this.setTool('zoom'); }
        else if (k === 's') { this.setTool('step'); }
        else if (k === 'm') { this.setTool('stamp'); }
        else if (e.shiftKey && k === 'r') { this.rotateCW(); }
        else if (e.shiftKey && k === 'h') { this.flipHorizontal(); }
        else if (e.shiftKey && k === 'v') { this.flipVertical(); }
        else if (k === '?') {
          const modal = document.getElementById('shortcuts-modal');
          if (modal) modal.classList.toggle('hidden');
        }
        else if (k === '+' || k === '=') { this.setZoom(this.zoom + 0.15); }
        else if (k === '-' || k === '_') { this.setZoom(this.zoom - 0.15); }
        else if (k === '0') { this.fitToScreen(); }
        else if (k === 'escape') {
          if (this.currentTool === 'crop') {
            this.cancelCrop();
          } else {
            const shortcutsModal = document.getElementById('shortcuts-modal');
            if (shortcutsModal && !shortcutsModal.classList.contains('hidden')) {
              shortcutsModal.classList.add('hidden');
            } else if (this.selectedActionIndex !== -1) {
              this.deselectAction();
            } else {
              const modal = document.getElementById('annotation-modal');
              if (modal && !modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
              }
            }
          }
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.isSpacePressed = false;
        this.updateCursor();
      }
    });
  }

  // --- Action Commitment & Rendering ---
  commitAction(endX, endY) {
    let action = null;

    switch (this.currentTool) {
      case 'pen':
        if (this.currentPoints.length > 1) {
          action = {
            type: 'pen',
            points: [...this.currentPoints],
            color: this.currentColor,
            width: this.strokeWidth,
            lineStyle: this.lineStyle,
          };
        }
        this.currentPoints = [];
        break;

      case 'arrow':
        if (Math.hypot(endX - this.startX, endY - this.startY) > 5) {
          action = {
            type: 'arrow',
            x1: this.startX,
            y1: this.startY,
            x2: endX,
            y2: endY,
            color: this.currentColor,
            width: this.strokeWidth,
            lineStyle: this.lineStyle,
            arrowStyle: this.arrowStyle,
          };
        }
        break;

      case 'rect':
        if (Math.abs(endX - this.startX) > 4 && Math.abs(endY - this.startY) > 4) {
          action = {
            type: 'rect',
            x: Math.min(this.startX, endX),
            y: Math.min(this.startY, endY),
            w: Math.abs(endX - this.startX),
            h: Math.abs(endY - this.startY),
            color: this.currentColor,
            width: this.strokeWidth,
            lineStyle: this.lineStyle,
          };
        }
        break;

      case 'ellipse':
        if (Math.abs(endX - this.startX) > 4 && Math.abs(endY - this.startY) > 4) {
          action = {
            type: 'ellipse',
            cx: (this.startX + endX) / 2,
            cy: (this.startY + endY) / 2,
            rx: Math.abs(endX - this.startX) / 2,
            ry: Math.abs(endY - this.startY) / 2,
            color: this.currentColor,
            width: this.strokeWidth,
            lineStyle: this.lineStyle,
          };
        }
        break;

      case 'highlight':
        if (Math.abs(endX - this.startX) > 4 && Math.abs(endY - this.startY) > 4) {
          action = {
            type: 'highlight',
            x: Math.min(this.startX, endX),
            y: Math.min(this.startY, endY),
            w: Math.abs(endX - this.startX),
            h: Math.abs(endY - this.startY),
            color: this.currentColor,
          };
        }
        break;

      case 'spotlight':
        if (Math.abs(endX - this.startX) > 4 && Math.abs(endY - this.startY) > 4) {
          action = {
            type: 'spotlight',
            spotlightShape: this.currentSpotlightShape || 'circle',
            spotlightMode: this.currentSpotlightMode || 'dark',
            hasRing: this.currentSpotlightRing !== false,
            x: Math.min(this.startX, endX),
            y: Math.min(this.startY, endY),
            w: Math.abs(endX - this.startX),
            h: Math.abs(endY - this.startY),
            color: this.currentColor === '#E5484D' ? '#FFFFFF' : (this.currentColor || '#FFFFFF'),
            width: Math.max(3, this.strokeWidth || 3),
          };
        }
        break;

      case 'blur':
        if (Math.abs(endX - this.startX) > 5 && Math.abs(endY - this.startY) > 5) {
          action = {
            type: 'blur',
            x: Math.min(this.startX, endX),
            y: Math.min(this.startY, endY),
            w: Math.abs(endX - this.startX),
            h: Math.abs(endY - this.startY),
            redactMode: this.currentRedactMode || 'blur',
            color: '#14171C',
          };
        }
        break;

      case 'zoom': {
        const dist = Math.hypot(endX - this.startX, endY - this.startY);
        const radius = dist < 8 ? 80 : Math.max(25, Math.round(dist));
        action = {
          type: 'zoom',
          cx: this.startX,
          cy: this.startY,
          radius,
          zoomLevel: this.currentZoomLevel || 2.0,
          hasHandle: this.zoomHasHandle !== undefined ? this.zoomHasHandle : true,
          handleAngle: Math.PI / 4,
          color: this.currentColor || '#14171C',
          width: Math.max(4, this.strokeWidth || 4),
        };
        break;
      }
    }

    if (action) {
      this.actions.push(action);
      this.redoStack = [];
      this.renderAll();
    } else {
      this.renderAll();
    }
  }

  addStepBadge(x, y) {
    const action = {
      type: 'step',
      x,
      y,
      number: this.stepCounter++,
      color: this.currentColor,
      radius: Math.max(12, this.fontSize),
    };
    this.actions.push(action);
    this.redoStack = [];
    this.renderAll();
  }

  handleTextClick(x, y) {
    this.commitActiveText();

    const input = document.createElement('div');
    input.contentEditable = 'true';
    input.className = 'annotation-text-input';
    input.style.left = `${x}px`;
    input.style.top = `${y}px`;
    input.style.fontSize = `${this.fontSize}px`;
    input.style.fontFamily = this.fontFamily;
    input.style.fontWeight = this.isBold ? '700' : '400';
    input.style.fontStyle = this.isItalic ? 'italic' : 'normal';
    input.style.textAlign = this.textAlign;
    input.style.color = this.currentColor;
    input.style.borderColor = this.currentColor;
    input.style.background = this.textBg ? 'rgba(2, 6, 23, 0.9)' : 'transparent';
    const decorParts = [];
    if (this.isUnderline) decorParts.push('underline');
    if (this.isStrikethrough) decorParts.push('line-through');
    input.style.textDecoration = decorParts.length ? decorParts.join(' ') : 'none';

    this.wrapper.appendChild(input);
    setTimeout(() => input.focus(), 0);

    this.activeTextElement = {
      element: input,
      x,
      y,
      color: this.currentColor,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      isBold: this.isBold,
      isItalic: this.isItalic,
      isUnderline: this.isUnderline,
      isStrikethrough: this.isStrikethrough,
      textAlign: this.textAlign,
      textBg: this.textBg,
    };

    if (typeof this.onTextModeActive === 'function') {
      this.onTextModeActive(this.getTextProperties());
    }

    input.addEventListener('blur', (e) => {
      // If clicking inside the text palette, do not commit yet
      if (e.relatedTarget && e.relatedTarget.closest('#anno-text-palette')) {
        return;
      }
      this.commitActiveText();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        input.blur();
      } else if (e.key === 'Escape') {
        input.remove();
        this.activeTextElement = null;
      }
    });
  }

  editExistingText(index) {
    const action = this.actions[index];
    if (!action || action.type !== 'text') return;

    this.selectAction(index);

    const input = document.createElement('div');
    input.contentEditable = 'true';
    input.className = 'annotation-text-input';
    input.innerText = action.text;
    input.style.left = `${action.x}px`;
    input.style.top = `${action.y}px`;
    input.style.fontSize = `${action.fontSize || 18}px`;
    input.style.fontFamily = action.fontFamily || this.fontFamily;
    input.style.fontWeight = action.isBold ? '700' : '400';
    input.style.fontStyle = action.isItalic ? 'italic' : 'normal';
    input.style.textAlign = action.textAlign || 'left';
    input.style.color = action.color || this.currentColor;
    input.style.borderColor = action.color || this.currentColor;
    input.style.background = (action.textBg !== false) ? 'rgba(2, 6, 23, 0.9)' : 'transparent';
    const editDecorParts = [];
    if (action.isUnderline) editDecorParts.push('underline');
    if (action.isStrikethrough) editDecorParts.push('line-through');
    input.style.textDecoration = editDecorParts.length ? editDecorParts.join(' ') : 'none';

    this.actions.splice(index, 1);
    this.renderAll();

    this.wrapper.appendChild(input);
    setTimeout(() => {
      input.focus();
      const range = document.createRange();
      range.selectNodeContents(input);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }, 0);

    this.activeTextElement = {
      element: input,
      x: action.x,
      y: action.y,
      color: action.color,
      fontSize: action.fontSize,
      fontFamily: action.fontFamily,
      isBold: action.isBold,
      isItalic: action.isItalic,
      isUnderline: action.isUnderline,
      isStrikethrough: action.isStrikethrough,
      textAlign: action.textAlign,
      textBg: action.textBg,
    };

    if (typeof this.onTextModeActive === 'function') {
      this.onTextModeActive(this.getTextProperties());
    }

    input.addEventListener('blur', (e) => {
      if (e.relatedTarget && e.relatedTarget.closest('#anno-text-palette')) {
        return;
      }
      this.commitActiveText();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        input.blur();
      } else if (e.key === 'Escape') {
        input.remove();
        this.activeTextElement = null;
        this.actions.splice(index, 0, action);
        this.renderAll();
      }
    });
  }

  commitActiveText() {
    if (!this.activeTextElement) return;

    const { element, x, y, color, fontSize, fontFamily, isBold, isItalic, isUnderline, isStrikethrough, textAlign, textBg } = this.activeTextElement;
    const text = element.innerText.trim();

    if (text) {
      const newAction = {
        type: 'text',
        text,
        x,
        y,
        color,
        fontSize,
        fontFamily,
        isBold,
        isItalic,
        isUnderline,
        isStrikethrough,
        textAlign,
        textBg,
      };
      this.actions.push(newAction);
      this.redoStack = [];
      this.selectedActionIndex = this.actions.length - 1;
      this.renderAll();
    }

    element.remove();
    this.activeTextElement = null;
  }

  // --- Rendering Functions ---
  clearDrawCanvas() {
    this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
  }

  renderAll() {
    if (!this.baseImage) return;

    // 1. Draw base background image
    this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
    this.bgCtx.drawImage(this.baseImage, 0, 0, this.imageWidth, this.imageHeight);

    // 2. Draw blur redactions directly on background canvas
    for (const action of this.actions) {
      if (action.type === 'blur') {
        this.drawBlur(this.bgCtx, action.x, action.y, action.w, action.h, action.redactMode || 'blur', action.color);
      }
    }

    // 2.5 Draw spotlight focus cutouts directly on background canvas
    const spotlights = this.actions.filter(a => a.type === 'spotlight');
    if (spotlights.length > 0) {
      this.drawSpotlights(this.bgCtx, spotlights);
    }

    // 3. Auto-number step badges and render vector markups
    let stepNum = 1;
    for (const action of this.actions) {
      if (action.type === 'step') {
        action.number = stepNum++;
      }
    }
    this.stepCounter = stepNum;

    this.clearDrawCanvas();
    for (let i = 0; i < this.actions.length; i++) {
      const action = this.actions[i];
      if (action.type === 'crop') continue;
      this.renderAction(this.drawCtx, action);
    }

    // 4. Render selection bounding box and handles
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      this.drawSelectionOutline(this.drawCtx, this.actions[this.selectedActionIndex]);
    }

    // 5. Render crop overlay and handles if crop tool is active
    if (this.currentTool === 'crop' && this.cropBox) {
      this.renderCropOverlay(this.drawCtx);
    }
  }

  renderAction(ctx, action) {
    if (!action || action.type === 'crop') return;
    ctx.save();

    // Halo Rule: Every annotation shape carries a contrasting 1.5px outline
    // to guarantee visibility on light or dark content (amber is 1.8:1 on white).
    const needsHalo = ['pen', 'arrow', 'rect', 'ellipse'].includes(action.type);
    if (needsHalo) {
      ctx.save();
      const baseWidth = action.width || 4;
      const haloWidth = baseWidth + 3; // 1.5px on each side
      const haloColor = (action.color === '#14171C' || action.color === 'black') ? '#FFFFFF' : 'rgba(12, 14, 18, 0.75)';

      switch (action.type) {
        case 'pen':
          if (action.points.length >= 2) {
            ctx.beginPath();
            ctx.strokeStyle = haloColor;
            ctx.lineWidth = haloWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            this.applyLineDash(ctx, action.lineStyle || 'solid', haloWidth);
            ctx.moveTo(action.points[0].x, action.points[0].y);
            for (let i = 1; i < action.points.length; i++) {
              ctx.lineTo(action.points[i].x, action.points[i].y);
            }
            ctx.stroke();
          }
          break;
        case 'arrow':
          this.drawArrow(ctx, action.x1, action.y1, action.x2, action.y2, haloColor, haloWidth, action.lineStyle || 'solid', action.arrowStyle || 'standard');
          break;
        case 'rect':
          ctx.strokeStyle = haloColor;
          ctx.lineWidth = haloWidth;
          this.applyLineDash(ctx, action.lineStyle || 'solid', haloWidth);
          ctx.strokeRect(action.x, action.y, action.w, action.h);
          break;
        case 'ellipse':
          ctx.beginPath();
          ctx.strokeStyle = haloColor;
          ctx.lineWidth = haloWidth;
          this.applyLineDash(ctx, action.lineStyle || 'solid', haloWidth);
          ctx.ellipse(action.cx, action.cy, action.rx, action.ry, 0, 0, 2 * Math.PI);
          ctx.stroke();
          break;
      }
      ctx.restore();
    }

    switch (action.type) {
      case 'pen':
        if (action.points.length < 2) break;
        ctx.beginPath();
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.width || 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        this.applyLineDash(ctx, action.lineStyle || 'solid', action.width || 4);
        ctx.moveTo(action.points[0].x, action.points[0].y);
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(action.points[i].x, action.points[i].y);
        }
        ctx.stroke();
        break;

      case 'arrow':
        this.drawArrow(ctx, action.x1, action.y1, action.x2, action.y2, action.color, action.width || 4, action.lineStyle || 'solid', action.arrowStyle || 'standard');
        break;

      case 'rect':
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.width || 4;
        this.applyLineDash(ctx, action.lineStyle || 'solid', action.width || 4);
        ctx.strokeRect(action.x, action.y, action.w, action.h);
        break;

      case 'ellipse':
        ctx.beginPath();
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.width || 4;
        this.applyLineDash(ctx, action.lineStyle || 'solid', action.width || 4);
        ctx.ellipse(action.cx, action.cy, action.rx, action.ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
        break;

      case 'highlight':
        ctx.fillStyle = this.getHighlightColor(action.color);
        ctx.fillRect(action.x, action.y, action.w, action.h);
        break;

      case 'text':
        this.drawText(ctx, action);
        break;

      case 'step':
        this.drawStepBadge(ctx, action.x, action.y, action.number, action.color, action.radius);
        break;

      case 'stamp':
        this.drawStampBadge(ctx, action.x, action.y, action.stamp, action.color, action.size || 32);
        break;

      case 'zoom':
        this.drawZoomMagnifier(ctx, action);
        break;
    }

    ctx.restore();
  }

  getHighlightColor(hex) {
    let c = (hex || '#ef4444').replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, 0.35)`;
  }

  drawArrow(ctx, x1, y1, x2, y2, color, width, lineStyle = 'solid', arrowStyle = 'standard') {
    const headLength = Math.max(14, width * 3.5);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const reverseAngle = Math.atan2(-dy, -dx);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';

    if (arrowStyle === 'line') {
      // Line only — no arrowhead at all
      this.applyLineDash(ctx, lineStyle, width);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (arrowStyle === 'curved' || arrowStyle === 'curved-alt') {
      // Curved Arc arrow (curved = Arc Down/Right, curved-alt = Arc Up/Left)
      const isAlt = arrowStyle === 'curved-alt';
      const dist = Math.hypot(dx, dy);
      const perpX = -dy / (dist || 1);
      const perpY = dx / (dist || 1);
      // Bow offset perpendicular to the chord
      const bow = Math.min(80, Math.max(25, dist * 0.22)) * (isAlt ? -1 : 1);
      const cpX = (x1 + x2) / 2 + perpX * bow;
      const cpY = (y1 + y2) / 2 + perpY * bow;

      // Arc tangent at end point (x2, y2)
      const endAngle = Math.atan2(y2 - cpY, x2 - cpX);
      const lineEndX = x2 - (headLength * 0.4) * Math.cos(endAngle);
      const lineEndY = y2 - (headLength * 0.4) * Math.sin(endAngle);

      this.applyLineDash(ctx, lineStyle, width);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cpX, cpY, lineEndX, lineEndY);
      ctx.stroke();

      // Arrow head oriented along the curve tangent
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLength * Math.cos(endAngle - Math.PI / 6), y2 - headLength * Math.sin(endAngle - Math.PI / 6));
      ctx.lineTo(x2 - headLength * Math.cos(endAngle + Math.PI / 6), y2 - headLength * Math.sin(endAngle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    } else if (arrowStyle === 'double') {
      // Double arrow — filled heads on both ends
      const lineStartX = x1 + (headLength * 0.4) * Math.cos(angle);
      const lineStartY = y1 + (headLength * 0.4) * Math.sin(angle);
      const lineEndX = x2 - (headLength * 0.4) * Math.cos(angle);
      const lineEndY = y2 - (headLength * 0.4) * Math.sin(angle);

      this.applyLineDash(ctx, lineStyle, width);
      ctx.beginPath();
      ctx.moveTo(lineStartX, lineStartY);
      ctx.lineTo(lineEndX, lineEndY);
      ctx.stroke();

      // Front head
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      // Rear head
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - headLength * Math.cos(reverseAngle - Math.PI / 6), y1 - headLength * Math.sin(reverseAngle - Math.PI / 6));
      ctx.lineTo(x1 - headLength * Math.cos(reverseAngle + Math.PI / 6), y1 - headLength * Math.sin(reverseAngle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    } else if (arrowStyle === 'double-open') {
      // Double open chevrons on both ends
      const lineStartX = x1 + (headLength * 0.4) * Math.cos(angle);
      const lineStartY = y1 + (headLength * 0.4) * Math.sin(angle);
      const lineEndX = x2 - (headLength * 0.4) * Math.cos(angle);
      const lineEndY = y2 - (headLength * 0.4) * Math.sin(angle);

      this.applyLineDash(ctx, lineStyle, width);
      ctx.beginPath();
      ctx.moveTo(lineStartX, lineStartY);
      ctx.lineTo(lineEndX, lineEndY);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.lineJoin = 'round';
      // Front open chevron
      ctx.beginPath();
      ctx.moveTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
      ctx.stroke();

      // Rear open chevron
      ctx.beginPath();
      ctx.moveTo(x1 - headLength * Math.cos(reverseAngle - Math.PI / 6), y1 - headLength * Math.sin(reverseAngle - Math.PI / 6));
      ctx.lineTo(x1, y1);
      ctx.lineTo(x1 - headLength * Math.cos(reverseAngle + Math.PI / 6), y1 - headLength * Math.sin(reverseAngle + Math.PI / 6));
      ctx.stroke();
    } else if (arrowStyle === 'open') {
      // Open arrow — chevron outline head
      const lineEndX = x2 - (headLength * 0.4) * Math.cos(angle);
      const lineEndY = y2 - (headLength * 0.4) * Math.sin(angle);

      this.applyLineDash(ctx, lineStyle, width);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(lineEndX, lineEndY);
      ctx.stroke();

      // Open chevron head
      ctx.setLineDash([]);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    } else if (arrowStyle === 'stealth') {
      // Stealth / Swept-back arrow head
      const lineEndX = x2 - (headLength * 0.45) * Math.cos(angle);
      const lineEndY = y2 - (headLength * 0.45) * Math.sin(angle);

      this.applyLineDash(ctx, lineStyle, width);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(lineEndX, lineEndY);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 5), y2 - headLength * Math.sin(angle - Math.PI / 5));
      ctx.lineTo(x2 - headLength * 0.6 * Math.cos(angle), y2 - headLength * 0.6 * Math.sin(angle));
      ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 5), y2 - headLength * Math.sin(angle + Math.PI / 5));
      ctx.closePath();
      ctx.fill();
    } else if (arrowStyle === 'diamond') {
      // Diamond arrowhead
      const dLen = headLength * 0.85;
      const dWidth = headLength * 0.45;
      const lineEndX = x2 - dLen * Math.cos(angle);
      const lineEndY = y2 - dLen * Math.sin(angle);

      this.applyLineDash(ctx, lineStyle, width);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(lineEndX, lineEndY);
      ctx.stroke();

      ctx.setLineDash([]);
      const midX = x2 - (dLen / 2) * Math.cos(angle);
      const midY = y2 - (dLen / 2) * Math.sin(angle);
      const perpAngle = angle + Math.PI / 2;

      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(midX + (dWidth / 2) * Math.cos(perpAngle), midY + (dWidth / 2) * Math.sin(perpAngle));
      ctx.lineTo(x2 - dLen * Math.cos(angle), y2 - dLen * Math.sin(angle));
      ctx.lineTo(midX - (dWidth / 2) * Math.cos(perpAngle), midY - (dWidth / 2) * Math.sin(perpAngle));
      ctx.closePath();
      ctx.fill();
    } else if (arrowStyle === 'circle') {
      // Circle / dot point endpoint
      const radius = Math.max(5, width * 1.5);
      const lineEndX = x2 - radius * Math.cos(angle);
      const lineEndY = y2 - radius * Math.sin(angle);

      this.applyLineDash(ctx, lineStyle, width);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(lineEndX, lineEndY);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(x2, y2, radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (arrowStyle === 'bar') {
      // T-Bar dimension ending
      const barHalf = Math.max(8, width * 2.2);
      const perpAngle = angle + Math.PI / 2;

      this.applyLineDash(ctx, lineStyle, width);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x2 + barHalf * Math.cos(perpAngle), y2 + barHalf * Math.sin(perpAngle));
      ctx.lineTo(x2 - barHalf * Math.cos(perpAngle), y2 - barHalf * Math.sin(perpAngle));
      ctx.stroke();
    } else {
      // Standard — filled triangle head (default)
      const lineEndX = x2 - (headLength * 0.4) * Math.cos(angle);
      const lineEndY = y2 - (headLength * 0.4) * Math.sin(angle);

      this.applyLineDash(ctx, lineStyle, width);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(lineEndX, lineEndY);
      ctx.stroke();

      // Filled head
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  drawText(ctx, action) {
    const fontSize = action.fontSize || 18;
    const fontFamily = action.fontFamily || "'Inter', -apple-system, sans-serif";
    const isBold = action.isBold !== undefined ? action.isBold : true;
    const isItalic = action.isItalic ? 'italic ' : '';
    const weight = isBold ? 'bold ' : 'normal ';
    const actionColor = action.color || '#ef4444';
    const textAlign = action.textAlign || 'left';
    const textBg = action.textBg;
    const hasBg = textBg !== false && textBg !== 'none' && textBg !== undefined;
    const preset = hasBg ? this.getNotePreset(textBg, actionColor) : null;
    const resolvedTextColor = preset ? (preset.text || actionColor) : actionColor;

    ctx.font = `${isItalic}${weight}${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'top';

    const lines = (action.text || '').split('\n');
    const lineHeight = Math.round(fontSize * 1.25);
    let maxLineWidth = 0;

    for (const line of lines) {
      const metrics = ctx.measureText(line || ' ');
      if (metrics.width > maxLineWidth) {
        maxLineWidth = metrics.width;
      }
    }

    const padding = preset && preset !== this.getNotePreset('dark') ? 10 : 6;
    const bgWidth = Math.max(20, maxLineWidth + padding * 2);
    const bgHeight = lines.length * lineHeight + padding * 2;

    let startX = action.x - padding;
    if (textAlign === 'center') {
      startX = action.x - bgWidth / 2;
    } else if (textAlign === 'right') {
      startX = action.x - bgWidth + padding;
    }

    // Text background plate
    if (hasBg && preset) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = preset.bg;
      ctx.strokeStyle = preset.border || actionColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);

      ctx.beginPath();
      const radius = preset === this.getNotePreset('dark') ? 4 : 8;
      if (ctx.roundRect) {
        ctx.roundRect(startX, action.y - padding, bgWidth, bgHeight, radius);
      } else {
        ctx.rect(startX, action.y - padding, bgWidth, bgHeight);
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else {
      // Subtle shadow for legibility over any background
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;
    }

    // Text content
    ctx.fillStyle = resolvedTextColor;
    ctx.textAlign = textAlign;

    let textRenderX = action.x;
    if (textAlign === 'center') {
      textRenderX = startX + bgWidth / 2;
    } else if (textAlign === 'right') {
      textRenderX = startX + bgWidth - padding;
    } else {
      textRenderX = startX + padding;
    }

    for (let i = 0; i < lines.length; i++) {
      const lineY = action.y + i * lineHeight;
      ctx.fillText(lines[i], textRenderX, lineY);

      const lineText = lines[i] || ' ';
      const lineWidth = ctx.measureText(lineText).width;
      let decoX = textRenderX;
      if (textAlign === 'center') {
        decoX = textRenderX - lineWidth / 2;
      } else if (textAlign === 'right') {
        decoX = textRenderX - lineWidth;
      }

      // Underline
      if (action.isUnderline) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, fontSize / 14);
        ctx.setLineDash([]);
        ctx.moveTo(decoX, lineY + fontSize + 1);
        ctx.lineTo(decoX + lineWidth, lineY + fontSize + 1);
        ctx.stroke();
      }

      // Strikethrough
      if (action.isStrikethrough) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, fontSize / 14);
        ctx.setLineDash([]);
        ctx.moveTo(decoX, lineY + fontSize * 0.55);
        ctx.lineTo(decoX + lineWidth, lineY + fontSize * 0.55);
        ctx.stroke();
      }
    }
  }

  drawStepBadge(ctx, x, y, number, color, radius = 14) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#0C0E12';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${radius * 1.1}px 'Inter', -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), x, y);
  }

  addStampBadge(x, y) {
    const action = {
      type: 'stamp',
      x,
      y,
      stamp: this.currentStamp || 'check',
      color: this.currentColor,
      size: Math.max(28, this.strokeWidth * 7),
    };
    this.actions.push(action);
    this.redoStack = [];
    this.renderAll();
  }

  drawStampBadge(ctx, x, y, stampType, color, size = 32) {
    ctx.save();
    const r = size / 2;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#0C0E12';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(2, size / 10);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const s = r * 0.55;

    switch (stampType) {
      case 'check':
        ctx.beginPath();
        ctx.moveTo(x - s * 0.6, y);
        ctx.lineTo(x - s * 0.1, y + s * 0.5);
        ctx.lineTo(x + s * 0.7, y - s * 0.5);
        ctx.stroke();
        break;

      case 'cross':
        ctx.beginPath();
        ctx.moveTo(x - s * 0.5, y - s * 0.5);
        ctx.lineTo(x + s * 0.5, y + s * 0.5);
        ctx.moveTo(x + s * 0.5, y - s * 0.5);
        ctx.lineTo(x - s * 0.5, y + s * 0.5);
        ctx.stroke();
        break;

      case 'star':
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const px = x + s * Math.cos(a);
          const py = y + s * Math.sin(a);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        break;

      case 'warning':
        ctx.font = `bold ${Math.round(r * 1.1)}px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', x, y);
        break;

      case 'question':
        ctx.font = `bold ${Math.round(r * 1.1)}px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x, y);
        break;

      case 'heart':
        ctx.beginPath();
        ctx.moveTo(x, y + s * 0.5);
        ctx.bezierCurveTo(x - s, y - s * 0.2, x - s * 0.5, y - s, x, y - s * 0.3);
        ctx.bezierCurveTo(x + s * 0.5, y - s, x + s, y - s * 0.2, x, y + s * 0.5);
        ctx.fill();
        break;
    }
    ctx.restore();
  }

  drawZoomMagnifier(ctx, action) {
    if (!action) return;
    const cx = action.cx;
    const cy = action.cy;
    const radius = Math.max(20, action.radius || 80);
    const zoomLevel = Math.max(1.1, action.zoomLevel || 2.0);
    const hasHandle = action.hasHandle !== false;
    const handleAngle = action.handleAngle ?? (Math.PI / 4);
    const color = action.color || '#14171C';
    const borderWidth = Math.max(3, action.width || 5);

    const cos = Math.cos(handleAngle);
    const sin = Math.sin(handleAngle);
    const handleLength = action.handleLength ?? Math.max(45, Math.round(radius * 0.65));
    const handleWidth = action.handleWidth ?? Math.max(12, Math.min(22, Math.round(radius * 0.16)));
    const hStartX = cx + (radius - 1) * cos;
    const hStartY = cy + (radius - 1) * sin;
    const hEndX = cx + (radius + handleLength) * cos;
    const hEndY = cy + (radius + handleLength) * sin;

    // 1. Realistic outer drop shadow behind the entire magnifying glass (lens + handle)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = Math.round(Math.max(14, radius * 0.2));
    ctx.shadowOffsetX = Math.round(Math.max(3, radius * 0.04));
    ctx.shadowOffsetY = Math.round(Math.max(8, radius * 0.12));

    if (hasHandle) {
      ctx.beginPath();
      ctx.moveTo(hStartX, hStartY);
      ctx.lineTo(hEndX, hEndY);
      ctx.strokeStyle = color;
      ctx.lineWidth = handleWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    // 2. Magnified image rendering inside the circular lens
    const sw = (radius * 2) / zoomLevel;
    const sh = (radius * 2) / zoomLevel;
    const sx = cx - radius / zoomLevel;
    const sy = cy - radius / zoomLevel;
    const dw = radius * 2;
    const dh = radius * 2;
    const dx = cx - radius;
    const dy = cy - radius;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.clip();

    // Clean neutral base fill under the magnified area
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(dx, dy, dw, dh);

    if (this.bgCanvas) {
      ctx.drawImage(this.bgCanvas, sx, sy, sw, sh, dx, dy, dw, dh);
    }

    // Glass glare / specular reflection
    const glare = ctx.createLinearGradient(
      cx - radius * 0.75, cy - radius * 0.75,
      cx + radius * 0.75, cy + radius * 0.75
    );
    glare.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
    glare.addColorStop(0.35, 'rgba(255, 255, 255, 0.04)');
    glare.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glare;
    ctx.fillRect(dx, dy, dw, dh);

    // Inner bezel highlight ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 1, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 3. Handle structure (body, metallic ferrule, spine highlight)
    if (hasHandle) {
      ctx.save();
      // Handle stem body
      ctx.beginPath();
      ctx.moveTo(hStartX, hStartY);
      ctx.lineTo(hEndX, hEndY);
      ctx.strokeStyle = color;
      ctx.lineWidth = handleWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Spine specular highlight along the handle
      ctx.beginPath();
      const hSpineStart = radius + 6;
      const hSpineEnd = radius + handleLength - 4;
      ctx.moveTo(cx + hSpineStart * cos, cy + hSpineStart * sin);
      ctx.lineTo(cx + hSpineEnd * cos, cy + hSpineEnd * sin);
      ctx.strokeStyle = (color === '#FFFFFF' || color === '#ECEEF2')
        ? 'rgba(0, 0, 0, 0.25)'
        : 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = Math.max(2, Math.round(handleWidth * 0.22));
      ctx.lineCap = 'round';
      ctx.stroke();

      // Metallic mounting collar (ferrule) connecting rim to handle
      const collarDist = radius + 2;
      const cxCollar = cx + collarDist * cos;
      const cyCollar = cy + collarDist * sin;
      const perpX = -sin;
      const perpY = cos;
      const cHalfW = (handleWidth * 1.15) / 2;
      ctx.beginPath();
      ctx.moveTo(cxCollar - perpX * cHalfW, cyCollar - perpY * cHalfW);
      ctx.lineTo(cxCollar + perpX * cHalfW, cyCollar + perpY * cHalfW);
      ctx.strokeStyle = (color === '#FFFFFF') ? '#8B93A1' : '#646C7B';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }

    // 4. Outer Circular Rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.lineWidth = borderWidth;
    ctx.stroke();
    ctx.restore();
  }

  async rotateCW() {
    this.commitActiveText();
    this.deselectAction();
    if (this.currentTool === 'crop') this.cancelCrop();
    if (!this.baseImage) return;

    const oldW = this.imageWidth;
    const oldH = this.imageHeight;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = oldH;
    offCanvas.height = oldW;
    const offCtx = offCanvas.getContext('2d');

    offCtx.translate(oldH / 2, oldW / 2);
    offCtx.rotate(Math.PI / 2);
    offCtx.drawImage(this.baseImage, -oldW / 2, -oldH / 2);

    const dataUrl = offCanvas.toDataURL();
    await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.baseImage = img;
        this.imageWidth = img.width;
        this.imageHeight = img.height;
        resolve();
      };
      img.src = dataUrl;
    });

    for (const act of this.actions) {
      if (act.type === 'crop') continue;
      if (act.type === 'pen') {
        act.points = act.points.map(p => ({ x: oldH - p.y, y: p.x }));
      } else if (act.type === 'arrow') {
        const nx1 = oldH - act.y1;
        const ny1 = act.x1;
        const nx2 = oldH - act.y2;
        const ny2 = act.x2;
        act.x1 = nx1; act.y1 = ny1; act.x2 = nx2; act.y2 = ny2;
      } else if (act.type === 'rect' || act.type === 'highlight' || act.type === 'blur' || act.type === 'spotlight') {
        const nx = oldH - (act.y + act.h);
        const ny = act.x;
        const nw = act.h;
        const nh = act.w;
        act.x = nx; act.y = ny; act.w = nw; act.h = nh;
      } else if (act.type === 'ellipse' || act.type === 'zoom') {
        const ncx = oldH - act.cy;
        const ncy = act.cx;
        if (act.type === 'ellipse') {
          const nrx = act.ry;
          const nry = act.rx;
          act.cx = ncx; act.cy = ncy; act.rx = nrx; act.ry = nry;
        } else {
          act.cx = ncx; act.cy = ncy;
          if (act.handleAngle !== undefined) act.handleAngle += Math.PI / 2;
        }
      } else if (act.type === 'text' || act.type === 'step' || act.type === 'stamp') {
        const nx = oldH - act.y;
        const ny = act.x;
        act.x = nx; act.y = ny;
      }
    }

    this.resizeCanvases(this.imageWidth, this.imageHeight);
    this.renderAll();
    this.fitToScreen();
  }

  async flipHorizontal() {
    this.commitActiveText();
    this.deselectAction();
    if (this.currentTool === 'crop') this.cancelCrop();
    if (!this.baseImage) return;

    const W = this.imageWidth;
    const H = this.imageHeight;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = W;
    offCanvas.height = H;
    const offCtx = offCanvas.getContext('2d');

    offCtx.translate(W, 0);
    offCtx.scale(-1, 1);
    offCtx.drawImage(this.baseImage, 0, 0);

    const dataUrl = offCanvas.toDataURL();
    await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.baseImage = img;
        resolve();
      };
      img.src = dataUrl;
    });

    for (const act of this.actions) {
      if (act.type === 'crop') continue;
      if (act.type === 'pen') {
        act.points = act.points.map(p => ({ x: W - p.x, y: p.y }));
      } else if (act.type === 'arrow') {
        act.x1 = W - act.x1;
        act.x2 = W - act.x2;
      } else if (act.type === 'rect' || act.type === 'highlight' || act.type === 'blur' || act.type === 'spotlight') {
        act.x = W - (act.x + act.w);
      } else if (act.type === 'ellipse' || act.type === 'zoom') {
        act.cx = W - act.cx;
        if (act.type === 'zoom' && act.handleAngle !== undefined) {
          act.handleAngle = Math.PI - act.handleAngle;
        }
      } else if (act.type === 'text' || act.type === 'step' || act.type === 'stamp') {
        act.x = W - act.x;
      }
    }

    this.renderAll();
  }

  async flipVertical() {
    this.commitActiveText();
    this.deselectAction();
    if (this.currentTool === 'crop') this.cancelCrop();
    if (!this.baseImage) return;

    const W = this.imageWidth;
    const H = this.imageHeight;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = W;
    offCanvas.height = H;
    const offCtx = offCanvas.getContext('2d');

    offCtx.translate(0, H);
    offCtx.scale(1, -1);
    offCtx.drawImage(this.baseImage, 0, 0);

    const dataUrl = offCanvas.toDataURL();
    await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.baseImage = img;
        resolve();
      };
      img.src = dataUrl;
    });

    for (const act of this.actions) {
      if (act.type === 'crop') continue;
      if (act.type === 'pen') {
        act.points = act.points.map(p => ({ x: p.x, y: H - p.y }));
      } else if (act.type === 'arrow') {
        act.y1 = H - act.y1;
        act.y2 = H - act.y2;
      } else if (act.type === 'rect' || act.type === 'highlight' || act.type === 'blur' || act.type === 'spotlight') {
        act.y = H - (act.y + act.h);
      } else if (act.type === 'ellipse' || act.type === 'zoom') {
        act.cy = H - act.cy;
        if (act.type === 'zoom' && act.handleAngle !== undefined) {
          act.handleAngle = -act.handleAngle;
        }
      } else if (act.type === 'text' || act.type === 'step' || act.type === 'stamp') {
        act.y = H - act.y;
      }
    }

    this.renderAll();
  }

  toggleFrame() {
    this.hasFrame = !this.hasFrame;
    return this.hasFrame;
  }

  drawBlur(ctx, x, y, w, h, mode = 'blur', color = '#14171C') {
    let rx = Math.round(x);
    let ry = Math.round(y);
    let rw = Math.round(w);
    let rh = Math.round(h);
    if (rw < 0) { rx += rw; rw = Math.abs(rw); }
    if (rh < 0) { ry += rh; rh = Math.abs(rh); }
    if (rw < 1 || rh < 1) return;

    if (mode === 'blackout') {
      ctx.save();
      ctx.fillStyle = color || '#14171C';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.restore();
      return;
    }

    if (!this.baseImage) return;

    if (mode === 'mosaic') {
      const blockSize = Math.min(12, Math.max(6, Math.floor(Math.min(rw, rh) / 2) || 12));
      const tinyW = Math.max(1, Math.round(rw / blockSize));
      const tinyH = Math.max(1, Math.round(rh / blockSize));
      const offCanvas = document.createElement('canvas');
      offCanvas.width = tinyW;
      offCanvas.height = tinyH;
      const offCtx = offCanvas.getContext('2d');
      // Draw source region downscaled to tiny canvas
      offCtx.drawImage(this.baseImage, rx, ry, rw, rh, 0, 0, tinyW, tinyH);

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offCanvas, 0, 0, tinyW, tinyH, rx, ry, rw, rh);
      ctx.restore();
      return;
    }

    // Default: 'blur' (Gaussian blur)
    ctx.save();
    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    ctx.clip();
    const pad = 24;
    const sx = Math.max(0, Math.floor(rx - pad));
    const sy = Math.max(0, Math.floor(ry - pad));
    const sRight = Math.min(this.imageWidth, Math.ceil(rx + rw + pad));
    const sBottom = Math.min(this.imageHeight, Math.ceil(ry + rh + pad));
    const sw = sRight - sx;
    const sh = sBottom - sy;
    ctx.filter = 'blur(12px)';
    ctx.drawImage(this.baseImage, sx, sy, sw, sh, sx, sy, sw, sh);
    ctx.restore();
  }

  drawSpotlights(ctx, spotlights) {
    if (!spotlights || spotlights.length === 0) return;

    ctx.save();
    // 1. Check if any spotlight uses blur background mode
    const hasBlur = spotlights.some(s => s.spotlightMode === 'blur');

    if (hasBlur) {
      // Create temporary offscreen blurred snapshot of current background
      const blurCanvas = document.createElement('canvas');
      blurCanvas.width = this.imageWidth;
      blurCanvas.height = this.imageHeight;
      const blurCtx = blurCanvas.getContext('2d');
      blurCtx.filter = 'blur(10px)';
      blurCtx.drawImage(this.bgCanvas, 0, 0);

      // Redraw blurred image over the background canvas
      ctx.drawImage(blurCanvas, 0, 0);

      // Subtle atmospheric dimming
      ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
      ctx.fillRect(0, 0, this.imageWidth, this.imageHeight);

      // Cut out sharp spotlight areas by clipping and restoring original baseImage
      ctx.save();
      ctx.beginPath();
      for (const action of spotlights) {
        this.addSpotlightPath(ctx, action);
      }
      ctx.clip();
      ctx.drawImage(this.baseImage, 0, 0, this.imageWidth, this.imageHeight);
      ctx.restore();
    } else {
      // Dark or Light scrim mode
      const isLight = spotlights.some(s => s.spotlightMode === 'light');
      const strength = spotlights[0]?.spotlightStrength ?? 0.62;

      ctx.beginPath();
      ctx.rect(0, 0, this.imageWidth, this.imageHeight);
      for (const action of spotlights) {
        this.addSpotlightPath(ctx, action);
      }
      ctx.fillStyle = isLight ? `rgba(255, 255, 255, ${strength})` : `rgba(15, 23, 42, ${strength})`;
      ctx.fill('evenodd');
    }

    // 2. Stroke glowing illuminated ring around each spotlight
    for (const action of spotlights) {
      if (action.hasRing === false) continue;
      ctx.save();
      ctx.strokeStyle = action.color || '#FFFFFF';
      ctx.lineWidth = action.width || 3;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      this.addSpotlightPath(ctx, action);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  addSpotlightPath(ctx, action) {
    if (action.spotlightShape === 'rect') {
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(action.x, action.y, action.w, action.h, 12);
      } else {
        ctx.rect(action.x, action.y, action.w, action.h);
      }
    } else if (action.spotlightShape === 'circle') {
      const cx = action.x + action.w / 2;
      const cy = action.y + action.h / 2;
      const r = Math.min(action.w, action.h) / 2;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    } else {
      const cx = action.x + action.w / 2;
      const cy = action.y + action.h / 2;
      const rx = action.w / 2;
      const ry = action.h / 2;
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    }
  }

  drawSelectionOutline(ctx, action) {
    const bbox = this.getActionBoundingBox(action);
    if (!bbox) return;

    ctx.save();
    ctx.strokeStyle = '#4E90F5';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);

    // Bounding rectangle
    if (action.type === 'spotlight' && action.spotlightShape !== 'rect') {
      const cx = action.x + action.w / 2;
      const cy = action.y + action.h / 2;
      ctx.beginPath();
      if (action.spotlightShape === 'circle') {
        const r = Math.min(action.w, action.h) / 2 + 2;
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
      } else {
        const rx = action.w / 2 + 2;
        const ry = action.h / 2 + 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      }
      ctx.stroke();
    } else if (action.type !== 'arrow') {
      ctx.strokeRect(bbox.x, bbox.y, bbox.w, bbox.h);
    } else {
      // For arrow, draw dashed line between endpoints
      ctx.beginPath();
      ctx.moveTo(action.x1, action.y1);
      ctx.lineTo(action.x2, action.y2);
      ctx.stroke();
    }

    // Resize grab handles
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#4E90F5';
    ctx.lineWidth = 1.5;

    const handles = this.getResizeHandles(action);
    const handleSize = 8;
    const half = handleSize / 2;

    for (const h of handles) {
      ctx.beginPath();
      ctx.arc(h.x, h.y, half + 1, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  // --- Real-time Drawing Previews ---
  renderPreviewPen() {
    this.clearDrawCanvas();
    for (let i = 0; i < this.actions.length; i++) {
      this.renderAction(this.drawCtx, this.actions[i]);
    }

    if (this.currentPoints.length > 1) {
      this.renderAction(this.drawCtx, {
        type: 'pen',
        points: this.currentPoints,
        color: this.currentColor,
        width: this.strokeWidth,
        lineStyle: this.lineStyle,
      });
    }
  }

  renderPreviewShape(x1, y1, x2, y2) {
    this.clearDrawCanvas();
    for (let i = 0; i < this.actions.length; i++) {
      this.renderAction(this.drawCtx, this.actions[i]);
    }

    this.drawCtx.save();
    switch (this.currentTool) {
      case 'arrow':
        this.drawArrow(this.drawCtx, x1, y1, x2, y2, this.currentColor, this.strokeWidth, this.lineStyle, this.arrowStyle);
        break;

      case 'rect':
        this.drawCtx.strokeStyle = this.currentColor;
        this.drawCtx.lineWidth = this.strokeWidth;
        this.applyLineDash(this.drawCtx, this.lineStyle, this.strokeWidth);
        this.drawCtx.strokeRect(
          Math.min(x1, x2),
          Math.min(y1, y2),
          Math.abs(x2 - x1),
          Math.abs(y2 - y1)
        );
        break;

      case 'ellipse':
        this.drawCtx.beginPath();
        this.drawCtx.strokeStyle = this.currentColor;
        this.drawCtx.lineWidth = this.strokeWidth;
        this.applyLineDash(this.drawCtx, this.lineStyle, this.strokeWidth);
        this.drawCtx.ellipse(
          (x1 + x2) / 2,
          (y1 + y2) / 2,
          Math.abs(x2 - x1) / 2,
          Math.abs(y2 - y1) / 2,
          0,
          0,
          2 * Math.PI
        );
        this.drawCtx.stroke();
        break;

      case 'highlight':
        this.drawCtx.fillStyle = this.getHighlightColor(this.currentColor);
        this.drawCtx.fillRect(
          Math.min(x1, x2),
          Math.min(y1, y2),
          Math.abs(x2 - x1),
          Math.abs(y2 - y1)
        );
        break;

      case 'spotlight': {
        const shape = this.currentSpotlightShape || 'circle';
        const bx = Math.min(x1, x2);
        const by = Math.min(y1, y2);
        const bw = Math.abs(x2 - x1);
        const bh = Math.abs(y2 - y1);
        const cx = bx + bw / 2;
        const cy = by + bh / 2;
        const rx = bw / 2;
        const ry = bh / 2;

        this.drawCtx.save();
        // Dimmed overlay with live preview cutout
        this.drawCtx.beginPath();
        this.drawCtx.rect(0, 0, this.imageWidth, this.imageHeight);
        if (shape === 'rect') {
          if (typeof this.drawCtx.roundRect === 'function') {
            this.drawCtx.roundRect(bx, by, bw, bh, 12);
          } else {
            this.drawCtx.rect(bx, by, bw, bh);
          }
        } else if (shape === 'circle') {
          const r = Math.min(bw, bh) / 2;
          this.drawCtx.arc(cx, cy, r, 0, Math.PI * 2);
        } else {
          this.drawCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        }
        this.drawCtx.fillStyle = 'rgba(15, 23, 42, 0.62)';
        this.drawCtx.fill('evenodd');

        // Glowing border ring
        this.drawCtx.strokeStyle = this.currentColor === '#E5484D' ? '#FFFFFF' : (this.currentColor || '#FFFFFF');
        this.drawCtx.lineWidth = Math.max(3, this.strokeWidth || 3);
        this.drawCtx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        this.drawCtx.shadowBlur = 14;
        this.drawCtx.beginPath();
        if (shape === 'rect') {
          if (typeof this.drawCtx.roundRect === 'function') {
            this.drawCtx.roundRect(bx, by, bw, bh, 12);
          } else {
            this.drawCtx.rect(bx, by, bw, bh);
          }
        } else if (shape === 'circle') {
          const r = Math.min(bw, bh) / 2;
          this.drawCtx.arc(cx, cy, r, 0, Math.PI * 2);
        } else {
          this.drawCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        }
        this.drawCtx.stroke();

        // Selection dashed indicator
        this.drawCtx.shadowColor = 'transparent';
        this.drawCtx.strokeStyle = '#4E90F5';
        this.drawCtx.lineWidth = 1.5;
        this.drawCtx.setLineDash([4, 4]);
        this.drawCtx.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
        this.drawCtx.restore();
        break;
      }

      case 'blur': {
        const bx = Math.min(x1, x2);
        const by = Math.min(y1, y2);
        const bw = Math.abs(x2 - x1);
        const bh = Math.abs(y2 - y1);
        const mode = this.currentRedactMode || 'blur';
        if (bw > 2 && bh > 2) {
          this.drawBlur(this.drawCtx, bx, by, bw, bh, mode, '#14171C');
        }
        this.drawCtx.save();
        this.drawCtx.strokeStyle = '#4E90F5';
        this.drawCtx.lineWidth = 1.5;
        this.drawCtx.setLineDash([4, 4]);
        this.drawCtx.strokeRect(bx, by, bw, bh);
        this.drawCtx.restore();
        break;
      }

      case 'zoom': {
        const dist = Math.hypot(x2 - x1, y2 - y1);
        const radius = dist < 8 ? 80 : Math.max(25, Math.round(dist));
        const angle = dist < 8 ? Math.PI / 4 : Math.atan2(y2 - y1, x2 - x1);
        this.drawZoomMagnifier(this.drawCtx, {
          type: 'zoom',
          cx: x1,
          cy: y1,
          radius,
          zoomLevel: this.currentZoomLevel || 2.0,
          hasHandle: this.zoomHasHandle !== undefined ? this.zoomHasHandle : true,
          handleAngle: angle,
          color: this.currentColor || '#14171C',
          width: Math.max(4, this.strokeWidth || 4),
        });
        break;
      }
    }
    this.drawCtx.restore();
  }

  // --- Crop Engine & Overlay ---
  hitTestCropHandle(x, y) {
    if (!this.cropBox) return null;
    const { x: bx, y: by, w: bw, h: bh } = this.cropBox;
    const hitRadius = Math.max(12, 12 / Math.max(0.1, this.zoom));

    const handles = [
      { id: 'nw', x: bx, y: by },
      { id: 'n',  x: bx + bw / 2, y: by },
      { id: 'ne', x: bx + bw, y: by },
      { id: 'e',  x: bx + bw, y: by + bh / 2 },
      { id: 'se', x: bx + bw, y: by + bh },
      { id: 's',  x: bx + bw / 2, y: by + bh },
      { id: 'sw', x: bx, y: by + bh },
      { id: 'w',  x: bx, y: by + bh / 2 }
    ];

    for (const h of handles) {
      if (Math.hypot(x - h.x, y - h.y) <= hitRadius) {
        return h.id;
      }
    }

    if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
      return 'inside';
    }

    return 'outside';
  }

  resizeCropBox(handle, dx, dy) {
    if (!this.cropInitialBox) return;
    const init = this.cropInitialBox;
    let x = init.x;
    let y = init.y;
    let w = init.w;
    let h = init.h;

    switch (handle) {
      case 'nw':
        x = init.x + dx;
        y = init.y + dy;
        w = init.w - dx;
        h = init.h - dy;
        break;
      case 'n':
        y = init.y + dy;
        h = init.h - dy;
        break;
      case 'ne':
        y = init.y + dy;
        w = init.w + dx;
        h = init.h - dy;
        break;
      case 'e':
        w = init.w + dx;
        break;
      case 'se':
        w = init.w + dx;
        h = init.h + dy;
        break;
      case 's':
        h = init.h + dy;
        break;
      case 'sw':
        x = init.x + dx;
        w = init.w - dx;
        h = init.h + dy;
        break;
      case 'w':
        x = init.x + dx;
        w = init.w - dx;
        break;
    }

    if (w < 0) {
      x += w;
      w = Math.abs(w);
    }
    if (h < 0) {
      y += h;
      h = Math.abs(h);
    }

    const clampedX = Math.max(0, Math.min(this.imageWidth - 20, x));
    const clampedY = Math.max(0, Math.min(this.imageHeight - 20, y));
    const clampedW = Math.max(20, Math.min(this.imageWidth - clampedX, w));
    const clampedH = Math.max(20, Math.min(this.imageHeight - clampedY, h));

    this.cropBox = {
      x: Math.round(clampedX),
      y: Math.round(clampedY),
      w: Math.round(clampedW),
      h: Math.round(clampedH)
    };
  }

  renderCropOverlay(ctx) {
    if (!this.cropBox) return;
    const { x, y, w, h } = this.cropBox;

    ctx.save();

    // 1. Dimmed exterior mask (4 quadrants outside crop rectangle)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
    if (y > 0) ctx.fillRect(0, 0, this.imageWidth, y);
    const bottomY = y + h;
    if (bottomY < this.imageHeight) ctx.fillRect(0, bottomY, this.imageWidth, this.imageHeight - bottomY);
    if (x > 0) ctx.fillRect(0, y, x, h);
    const rightX = x + w;
    if (rightX < this.imageWidth) ctx.fillRect(rightX, y, this.imageWidth - rightX, h);

    // 2. Crop bounding rectangle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);

    // 3. Rule-of-thirds grid
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const thirdW = w / 3;
    const thirdH = h / 3;

    ctx.beginPath();
    ctx.moveTo(x + thirdW, y);
    ctx.lineTo(x + thirdW, y + h);
    ctx.moveTo(x + thirdW * 2, y);
    ctx.lineTo(x + thirdW * 2, y + h);

    ctx.moveTo(x, y + thirdH);
    ctx.lineTo(x + w, y + thirdH);
    ctx.moveTo(x, y + thirdH * 2);
    ctx.lineTo(x + w, y + thirdH * 2);
    ctx.stroke();
    ctx.restore();

    // 4. Heavy corner brackets & midpoint ticks
    const bracketLen = Math.min(22, Math.max(8, Math.min(w, h) / 3));
    const bracketThick = Math.max(3, Math.min(4, 3 / Math.max(0.5, this.zoom)));

    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = bracketThick;
    ctx.lineCap = 'square';

    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 4;

    // NW
    ctx.beginPath();
    ctx.moveTo(x, y + bracketLen);
    ctx.lineTo(x, y);
    ctx.lineTo(x + bracketLen, y);
    ctx.stroke();

    // NE
    ctx.beginPath();
    ctx.moveTo(x + w - bracketLen, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + bracketLen);
    ctx.stroke();

    // SE
    ctx.beginPath();
    ctx.moveTo(x + w, y + h - bracketLen);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w - bracketLen, y + h);
    ctx.stroke();

    // SW
    ctx.beginPath();
    ctx.moveTo(x + bracketLen, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + h - bracketLen);
    ctx.stroke();

    // Midpoint ticks (N, S, E, W)
    const midLen = Math.min(16, Math.max(6, Math.min(w, h) / 4));
    // N
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - midLen / 2, y);
    ctx.lineTo(x + w / 2 + midLen / 2, y);
    ctx.stroke();

    // S
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - midLen / 2, y + h);
    ctx.lineTo(x + w / 2 + midLen / 2, y + h);
    ctx.stroke();

    // W
    ctx.beginPath();
    ctx.moveTo(x, y + h / 2 - midLen / 2);
    ctx.lineTo(x, y + h / 2 + midLen / 2);
    ctx.stroke();

    // E
    ctx.beginPath();
    ctx.moveTo(x + w, y + h / 2 - midLen / 2);
    ctx.lineTo(x + w, y + h / 2 + midLen / 2);
    ctx.stroke();

    ctx.restore();
    ctx.restore();

    this.updateCropToolbar();
  }

  updateCropToolbar() {
    if (!this.cropToolbar || !this.cropBox || this.currentTool !== 'crop') {
      if (this.cropToolbar) this.cropToolbar.classList.add('hidden');
      return;
    }

    this.cropDimBadge.textContent = `${Math.round(this.cropBox.w)} × ${Math.round(this.cropBox.h)} px`;

    const zoom = Math.max(0.05, this.zoom);
    const tbWidth = 200 / zoom;
    const tbHeight = 36 / zoom;

    let left = this.cropBox.x + this.cropBox.w / 2;
    left = Math.max(tbWidth / 2 + 8, Math.min(this.imageWidth - tbWidth / 2 - 8, left));

    let top;
    if (this.cropBox.y + this.cropBox.h + tbHeight + 16 <= this.imageHeight) {
      top = this.cropBox.y + this.cropBox.h + 12;
    } else if (this.cropBox.y >= tbHeight + 16) {
      top = this.cropBox.y - tbHeight - 12;
    } else {
      top = Math.max(8, this.cropBox.y + this.cropBox.h - tbHeight - 10);
    }

    this.cropToolbar.style.left = `${left}px`;
    this.cropToolbar.style.top = `${top}px`;
    this.cropToolbar.style.transform = `translate(-50%, 0) scale(${1 / zoom})`;
    this.cropToolbar.style.transformOrigin = 'top center';
    this.cropToolbar.classList.remove('hidden');
  }

  async applyCrop() {
    if (!this.cropBox || !this.baseImage) return;

    const cropX = Math.max(0, Math.min(this.imageWidth - 10, this.cropBox.x));
    const cropY = Math.max(0, Math.min(this.imageHeight - 10, this.cropBox.y));
    const cropW = Math.max(10, Math.min(this.imageWidth - cropX, this.cropBox.w));
    const cropH = Math.max(10, Math.min(this.imageHeight - cropY, this.cropBox.h));

    if (cropX === 0 && cropY === 0 && cropW === this.imageWidth && cropH === this.imageHeight) {
      this.cancelCrop();
      return;
    }

    const prevImage = this.baseImage;
    const prevWidth = this.imageWidth;
    const prevHeight = this.imageHeight;
    const prevActions = this.actions.map(a => this.cloneAction(a));

    const offCanvas = document.createElement('canvas');
    offCanvas.width = cropW;
    offCanvas.height = cropH;
    const offCtx = offCanvas.getContext('2d');
    offCtx.drawImage(prevImage, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    const dataUrl = offCanvas.toDataURL('image/png');
    const newImg = new Image();
    newImg.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
      newImg.onload = () => resolve();
      newImg.onerror = reject;
      newImg.src = dataUrl;
    });

    const newActions = [];
    for (const act of this.actions) {
      if (act.type === 'crop') continue;
      const translated = this.cloneAction(act);
      this.translateAction(translated, -cropX, -cropY);
      newActions.push(translated);
    }

    const cropAction = {
      type: 'crop',
      prevImage,
      prevWidth,
      prevHeight,
      prevActions,
      newImage: newImg,
      newWidth: cropW,
      newHeight: cropH,
      newActions,
      cropX,
      cropY
    };

    newActions.push(cropAction);
    this.actions = newActions;
    this.redoStack = [];

    this.baseImage = newImg;
    this.imageWidth = cropW;
    this.imageHeight = cropH;
    this.cropBox = null;
    if (this.cropToolbar) {
      this.cropToolbar.classList.add('hidden');
    }

    this.resizeCanvases(cropW, cropH);
    this.setTool('select');
    this.fitToScreen();
    this.renderAll();
  }

  cancelCrop() {
    this.cropBox = null;
    if (this.cropToolbar) {
      this.cropToolbar.classList.add('hidden');
    }
    this.setTool('select');
    this.renderAll();
  }

  // --- History Controls ---
  undo() {
    this.commitActiveText();
    this.deselectAction();
    if (this.actions.length === 0) return;
    const popped = this.actions.pop();
    if (popped.type === 'crop') {
      this.baseImage = popped.prevImage;
      this.imageWidth = popped.prevWidth;
      this.imageHeight = popped.prevHeight;
      this.actions = popped.prevActions.map(a => this.cloneAction(a));
      this.resizeCanvases(this.imageWidth, this.imageHeight);
      this.fitToScreen();
    }
    this.redoStack.push(popped);
    this.renderAll();
  }

  redo() {
    this.commitActiveText();
    this.deselectAction();
    if (this.redoStack.length === 0) return;
    const action = this.redoStack.pop();
    if (action.type === 'crop') {
      this.baseImage = action.newImage;
      this.imageWidth = action.newWidth;
      this.imageHeight = action.newHeight;
      this.actions = action.newActions.map(a => this.cloneAction(a));
      this.actions.push(action);
      this.resizeCanvases(this.imageWidth, this.imageHeight);
      this.fitToScreen();
    } else {
      this.actions.push(action);
    }
    this.renderAll();
  }

  clear() {
    this.commitActiveText();
    this.deselectAction();
    if (this.actions.length === 0) return;
    this.actions = [];
    this.redoStack = [];
    this.stepCounter = 1;
    this.renderAll();
  }

  // --- Export & Outputs ---
  getMergedCanvas() {
    this.commitActiveText();
    this.deselectAction();
    if (this.currentTool === 'crop') {
      this.cancelCrop();
    }

    if (!this.hasFrame) {
      const merged = document.createElement('canvas');
      merged.width = this.imageWidth;
      merged.height = this.imageHeight;
      const ctx = merged.getContext('2d');
      ctx.drawImage(this.bgCanvas, 0, 0);
      ctx.drawImage(this.drawCanvas, 0, 0);
      return merged;
    }

    // Framed Presentation Mode
    const pad = Math.max(32, Math.round(Math.min(this.imageWidth, this.imageHeight) * 0.08));
    const merged = document.createElement('canvas');
    merged.width = this.imageWidth + pad * 2;
    merged.height = this.imageHeight + pad * 2;
    const ctx = merged.getContext('2d');

    // Smooth gradient background card
    const grad = ctx.createLinearGradient(0, 0, merged.width, merged.height);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(1, '#1E293B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, merged.width, merged.height);

    // Drop shadow for inner image card
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = Math.round(pad * 0.6);
    ctx.shadowOffsetY = Math.round(pad * 0.3);

    const rx = pad;
    const ry = pad;
    const rw = this.imageWidth;
    const rh = this.imageHeight;
    const radius = 12;

    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(rx, ry, rw, rh, radius);
    } else {
      ctx.rect(rx, ry, rw, rh);
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    // Clip & draw image + annotations
    ctx.save();
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(rx, ry, rw, rh, radius);
    } else {
      ctx.rect(rx, ry, rw, rh);
    }
    ctx.clip();
    ctx.drawImage(this.bgCanvas, rx, ry);
    ctx.drawImage(this.drawCanvas, rx, ry);
    ctx.restore();

    return merged;
  }

  async toBlob(type = 'image/png', quality = 0.92) {
    const merged = this.getMergedCanvas();
    return new Promise((resolve) => {
      merged.toBlob((blob) => resolve(blob), type, quality);
    });
  }

  toDataURL(type = 'image/png', quality = 0.92) {
    const merged = this.getMergedCanvas();
    return merged.toDataURL(type, quality);
  }

  async copyToClipboard() {
    try {
      const blob = await this.toBlob('image/png');
      if (!blob) throw new Error('Could not generate image blob');
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return true;
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      throw err;
    }
  }

  async download(filename = `annotated_${Date.now()}.png`) {
    try {
      const blob = await this.toBlob('image/png');
      if (!blob) throw new Error('Could not generate image data');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 2000);
    } catch (err) {
      console.error('Download failed:', err);
      throw err;
    }
  }
}



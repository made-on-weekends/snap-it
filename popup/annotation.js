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
    this.hasFrame = false; // Presentation canvas background frame toggle

    // Text Tool Properties
    this.fontFamily = "'Inter', system-ui, sans-serif";
    this.fontSize = 18;
    this.isBold = true;
    this.isItalic = false;
    this.isUnderline = false;
    this.isStrikethrough = false;
    this.textAlign = 'left'; // 'left', 'center', 'right'
    this.textBg = true;

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

    this.initEvents();
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
    this.currentTool = tool;
    if (tool !== 'select') {
      this.deselectAction();
    }
    this.updateCursor();

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
      this.activeTextElement.element.style.background = hasBg ? 'rgba(2, 6, 23, 0.9)' : 'transparent';
      this.activeTextElement.element.style.border = hasBg ? `1.5px solid ${this.currentColor}` : '1.5px dashed rgba(255, 255, 255, 0.4)';
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

  getCursorForTool(tool) {
    switch (tool) {
      case 'select':
        return 'default';
      case 'pen':
      case 'arrow':
      case 'rect':
      case 'ellipse':
      case 'highlight':
      case 'blur':
      case 'step':
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
      if (this.isPointInsideAction(x, y, action)) {
        return i;
      }
    }
    return -1;
  }

  isPointInsideAction(px, py, action) {
    switch (action.type) {
      case 'arrow': {
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

      case 'highlight':
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
      case 'blur': {
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
      case 'text':
      case 'step':
      case 'stamp':
        action.x += dx;
        action.y += dy;
        break;
      case 'ellipse':
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
        const k = e.key.toLowerCase();
        if (k === 'v') { this.setTool('select'); }
        else if (k === 'a') { this.setTool('arrow'); }
        else if (k === 'r' && !e.shiftKey) { this.setTool('rect'); }
        else if (k === 'c') { this.setTool('ellipse'); }
        else if (k === 'p') { this.setTool('pen'); }
        else if (k === 't') { this.setTool('text'); }
        else if (k === 'h' && !e.shiftKey) { this.setTool('highlight'); }
        else if (k === 'b') { this.setTool('blur'); }
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

      case 'blur':
        if (Math.abs(endX - this.startX) > 5 && Math.abs(endY - this.startY) > 5) {
          action = {
            type: 'blur',
            x: Math.min(this.startX, endX),
            y: Math.min(this.startY, endY),
            w: Math.abs(endX - this.startX),
            h: Math.abs(endY - this.startY),
          };
        }
        break;
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
        this.drawBlur(this.bgCtx, action.x, action.y, action.w, action.h);
      }
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
      this.renderAction(this.drawCtx, action);
    }

    // 4. Render selection bounding box and handles
    if (this.selectedActionIndex !== -1 && this.selectedActionIndex < this.actions.length) {
      this.drawSelectionOutline(this.drawCtx, this.actions[this.selectedActionIndex]);
    }
  }

  renderAction(ctx, action) {
    ctx.save();

    // Mandatory Halo Rule (DESIGN.md §8): Every annotation shape carries a contrasting 1.5px outline
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
    const color = action.color || '#ef4444';
    const textAlign = action.textAlign || 'left';
    const hasBg = action.textBg !== false;

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

    const padding = 6;
    const bgWidth = Math.max(20, maxLineWidth + padding * 2);
    const bgHeight = lines.length * lineHeight + padding * 2;

    let startX = action.x - padding;
    if (textAlign === 'center') {
      startX = action.x - bgWidth / 2;
    } else if (textAlign === 'right') {
      startX = action.x - bgWidth + padding;
    }

    // Text background plate
    if (hasBg) {
      ctx.fillStyle = 'rgba(12, 14, 18, 0.88)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(startX, action.y - padding, bgWidth, bgHeight, 4);
      } else {
        ctx.rect(startX, action.y - padding, bgWidth, bgHeight);
      }
      ctx.fill();
      ctx.stroke();
    } else {
      // Subtle shadow for legibility over any background
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;
    }

    // Text content
    ctx.fillStyle = color;
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

  async rotateCW() {
    this.commitActiveText();
    this.deselectAction();
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
      if (act.type === 'pen') {
        act.points = act.points.map(p => ({ x: oldH - p.y, y: p.x }));
      } else if (act.type === 'arrow') {
        const nx1 = oldH - act.y1;
        const ny1 = act.x1;
        const nx2 = oldH - act.y2;
        const ny2 = act.x2;
        act.x1 = nx1; act.y1 = ny1; act.x2 = nx2; act.y2 = ny2;
      } else if (act.type === 'rect' || act.type === 'highlight' || act.type === 'blur') {
        const nx = oldH - (act.y + act.h);
        const ny = act.x;
        const nw = act.h;
        const nh = act.w;
        act.x = nx; act.y = ny; act.w = nw; act.h = nh;
      } else if (act.type === 'ellipse') {
        const ncx = oldH - act.cy;
        const ncy = act.cx;
        const nrx = act.ry;
        const nry = act.rx;
        act.cx = ncx; act.cy = ncy; act.rx = nrx; act.ry = nry;
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
      if (act.type === 'pen') {
        act.points = act.points.map(p => ({ x: W - p.x, y: p.y }));
      } else if (act.type === 'arrow') {
        act.x1 = W - act.x1;
        act.x2 = W - act.x2;
      } else if (act.type === 'rect' || act.type === 'highlight' || act.type === 'blur') {
        act.x = W - (act.x + act.w);
      } else if (act.type === 'ellipse') {
        act.cx = W - act.cx;
      } else if (act.type === 'text' || act.type === 'step' || act.type === 'stamp') {
        act.x = W - act.x;
      }
    }

    this.renderAll();
  }

  async flipVertical() {
    this.commitActiveText();
    this.deselectAction();
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
      if (act.type === 'pen') {
        act.points = act.points.map(p => ({ x: p.x, y: H - p.y }));
      } else if (act.type === 'arrow') {
        act.y1 = H - act.y1;
        act.y2 = H - act.y2;
      } else if (act.type === 'rect' || act.type === 'highlight' || act.type === 'blur') {
        act.y = H - (act.y + act.h);
      } else if (act.type === 'ellipse') {
        act.cy = H - act.cy;
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

  drawBlur(ctx, x, y, w, h) {
    // Redaction is a solid fill, not blur/pixelation (DESIGN.md §11)
    ctx.save();
    ctx.fillStyle = '#14171C';
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  drawSelectionOutline(ctx, action) {
    const bbox = this.getActionBoundingBox(action);
    if (!bbox) return;

    ctx.save();
    ctx.strokeStyle = '#4E90F5';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);

    // Bounding rectangle
    if (action.type !== 'arrow') {
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

      case 'blur':
        this.drawCtx.fillStyle = 'rgba(14, 165, 233, 0.2)';
        this.drawCtx.strokeStyle = 'rgba(14, 165, 233, 0.8)';
        this.drawCtx.lineWidth = 1;
        this.drawCtx.setLineDash([4, 4]);
        this.drawCtx.fillRect(
          Math.min(x1, x2),
          Math.min(y1, y2),
          Math.abs(x2 - x1),
          Math.abs(y2 - y1)
        );
        this.drawCtx.strokeRect(
          Math.min(x1, x2),
          Math.min(y1, y2),
          Math.abs(x2 - x1),
          Math.abs(y2 - y1)
        );
        break;
    }
    this.drawCtx.restore();
  }

  // --- History Controls ---
  undo() {
    this.commitActiveText();
    this.deselectAction();
    if (this.actions.length === 0) return;
    const popped = this.actions.pop();
    this.redoStack.push(popped);
    this.renderAll();
  }

  redo() {
    this.commitActiveText();
    this.deselectAction();
    if (this.redoStack.length === 0) return;
    const action = this.redoStack.pop();
    this.actions.push(action);
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



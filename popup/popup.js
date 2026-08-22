/**
 * Popup script for SnapIt extension.
 * Supports Single Screenshot capture, Batch Screenshot queue, and Annotation Studio.
 */

// --- Global Studio & State ---
let annotationStudio = null;
let lastCapturedDataUrl = null;
let lastCapturedFilename = null;
let lastReportResults = [];
const localScreenshotCache = new Map();

// --- Toast Helper ---
function showToast(message, duration = 2500) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, duration);
}

// --- DOM Elements ---
// Header & Navigation
const settingsBtn = document.getElementById('settings-btn');
const uploadBtn = document.getElementById('upload-btn');
const imageFileInput = document.getElementById('image-file-input');
const singleSection = document.getElementById('single-section');
const batchSection = document.getElementById('batch-section');
const annotateUploadSection = document.getElementById('annotate-upload-section');
const dropzoneSelectBtn = document.getElementById('dropzone-select-btn');
const uploadDropzoneCard = document.getElementById('upload-dropzone-card');
const customFolderIndicator = document.getElementById('custom-folder-indicator');
const customFolderIndicatorText = document.getElementById('custom-folder-indicator-text');
const fixFolderBtn = document.getElementById('fix-folder-btn');

// Single Capture Result
const singleResultCard = document.getElementById('single-result-card');
const singleResultUrl = document.getElementById('single-result-url');
const singleResultImg = document.getElementById('single-result-img');
const singleAnnotateBtn = document.getElementById('single-annotate-btn');
const singleCopyBtn = document.getElementById('single-copy-btn');
const singleDownloadBtn = document.getElementById('single-download-btn');
const singleCloseBtn = document.getElementById('single-close-btn');

// Batch Capture Section
const batchInputSection = document.getElementById('batch-input-section');
const batchControls = document.getElementById('batch-controls');
const urlInput = document.getElementById('url-input');
const urlCountNum = document.getElementById('url-count-num');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const progressSection = document.getElementById('progress-section');
const progressStatus = document.getElementById('progress-status');
const progressCounter = document.getElementById('progress-counter');
const progressBar = document.getElementById('progress-bar');
const currentUrlEl = document.getElementById('current-url');
const logEl = document.getElementById('log');

// Report Section
const reportSection = document.getElementById('report-section');
const closeReportBtn = document.getElementById('close-report-btn');
const newBatchBtn = document.getElementById('new-batch-btn');
const reportTotal = document.getElementById('report-total');
const reportSuccess = document.getElementById('report-success');
const reportFailed = document.getElementById('report-failed');
const reportDuration = document.getElementById('report-duration');
const exportCsvBtn = document.getElementById('export-csv-btn');
const exportJsonBtn = document.getElementById('export-json-btn');
const reportTableBody = document.getElementById('report-table-body');

// Annotation Studio Elements
const annotationModal = document.getElementById('annotation-modal');
const annoCloseBtn = document.getElementById('anno-close-btn');
const annotationViewport = document.getElementById('annotation-viewport');
const annoToolBtns = document.querySelectorAll('.anno-tool-btn');
const annoColorBtn = document.getElementById('anno-color-btn');
const annoColorPalette = document.getElementById('anno-color-palette');
const annoCurrentColorPreview = document.getElementById('anno-current-color-preview');
const colorSwatches = document.querySelectorAll('.color-swatch');
const annoLineStyleBtn = document.getElementById('anno-line-style-btn');
const annoLineStylePalette = document.getElementById('anno-line-style-palette');
const lineStyleBtns = document.querySelectorAll('.line-style-btn');
const annoCurrentLineStyleLine = document.getElementById('anno-current-line-style-line');
const annoLineWidth = document.getElementById('anno-line-width');
const annoUndoBtn = document.getElementById('anno-undo-btn');
const annoRedoBtn = document.getElementById('anno-redo-btn');
const annoClearBtn = document.getElementById('anno-clear-btn');
const annoZoomIn = document.getElementById('anno-zoom-in');
const annoZoomOut = document.getElementById('anno-zoom-out');
const annoFitSelect = document.getElementById('anno-fit-select');
const annoCustomColor = document.getElementById('anno-custom-color');
const annoTextPalette = document.getElementById('anno-text-palette');
const textPaletteCloseBtn = document.getElementById('text-palette-close-btn');
const textFontFamily = document.getElementById('text-font-family');
const textFontSizeSlider = document.getElementById('text-font-size-slider');
const textFontSizeSelect = document.getElementById('text-font-size-select');
const textFontSizeVal = document.getElementById('text-font-size-val');
const textBoldBtn = document.getElementById('text-bold-btn');
const textItalicBtn = document.getElementById('text-italic-btn');
const textUnderlineBtn = document.getElementById('text-underline-btn');
const textStrikethroughBtn = document.getElementById('text-strikethrough-btn');
const textAlignBtns = document.querySelectorAll('.text-align-btn');
const textBgBadgeBtn = document.getElementById('text-bg-badge-btn');
const textBgNoneBtn = document.getElementById('text-bg-none-btn');
const annoCopyBtn = document.getElementById('anno-copy-btn');
const annoSaveBtn = document.getElementById('anno-save-btn');
const annoArrowPalette = document.getElementById('anno-arrow-palette');
const arrowStyleBtns = document.querySelectorAll('.arrow-style-btn');
const annoStampBtn = document.getElementById('anno-stamp-btn');
const annoStampPalette = document.getElementById('anno-stamp-palette');
const stampSelectBtns = document.querySelectorAll('.stamp-select-btn');
const annoRotateCw = document.getElementById('anno-rotate-cw');
const annoFlipH = document.getElementById('anno-flip-h');
const annoFlipV = document.getElementById('anno-flip-v');
const annoFrameToggle = document.getElementById('anno-frame-toggle');
const annoShortcutsBtn = document.getElementById('anno-shortcuts-btn');
const shortcutsModal = document.getElementById('shortcuts-modal');
const closeShortcutsBtn = document.getElementById('close-shortcuts-btn');

// ============================================================================
// MODE SWITCHER & SINGLE RESULT DISPLAY
// ============================================================================
function displaySingleResult(result) {
  lastCapturedDataUrl = result.dataUrl;
  lastCapturedFilename = result.filename;
  if (singleResultUrl) singleResultUrl.textContent = result.url || 'Captured Webpage';
  if (singleResultImg) singleResultImg.src = result.dataUrl;
  if (singleSection) singleSection.classList.remove('hidden');
  if (singleResultCard) singleResultCard.classList.remove('hidden');
  if (batchSection) batchSection.classList.add('hidden');
}

function switchMode(mode) {
  if (mode === 'single') {
    if (singleSection) singleSection.classList.remove('hidden');
    if (batchSection) batchSection.classList.add('hidden');
    if (annotateUploadSection) annotateUploadSection.classList.add('hidden');
  } else if (mode === 'annotate') {
    if (annotateUploadSection) annotateUploadSection.classList.remove('hidden');
    if (singleSection) singleSection.classList.add('hidden');
    if (batchSection) batchSection.classList.add('hidden');
  } else {
    if (batchSection) batchSection.classList.remove('hidden');
    if (singleSection) singleSection.classList.add('hidden');
    if (annotateUploadSection) annotateUploadSection.classList.add('hidden');
  }
}

if (singleAnnotateBtn) {
  singleAnnotateBtn.addEventListener('click', () => {
    if (lastCapturedDataUrl) {
      openAnnotationStudio(lastCapturedDataUrl, lastCapturedFilename);
    }
  });
}

if (singleCopyBtn) {
  singleCopyBtn.addEventListener('click', async () => {
    if (!lastCapturedDataUrl) return;
    try {
      const res = await fetch(lastCapturedDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('Copied');
    } catch {
      showToast('Clipboard write failed.');
    }
  });
}

if (singleDownloadBtn) {
  singleDownloadBtn.addEventListener('click', async () => {
    if (!lastCapturedDataUrl) return;
    try {
      const { settings } = await chrome.storage.sync.get('settings');
      let subfolder = '';
      let baseName = '';
      if (lastCapturedFilename && lastCapturedFilename.includes('/')) {
        const parts = lastCapturedFilename.split('/');
        baseName = parts.pop();
        subfolder = parts.join('/') + '/';
      } else if (lastCapturedFilename) {
        baseName = lastCapturedFilename;
        subfolder = settings?.subfolder ? `${settings.subfolder}/` : '';
      } else {
        baseName = `screenshot_${Date.now()}.png`;
        subfolder = settings?.subfolder ? `${settings.subfolder}/` : '';
      }
      const fullFilename = `${subfolder}${baseName}`;

      if (settings?.saveLocation === 'custom') {
        const dirHandle = await loadDirectoryHandle();
        if (dirHandle) {
          const hasPerm = await verifyPermission(dirHandle, true);
          if (hasPerm) {
            await saveToCustomDirectory(dirHandle, lastCapturedDataUrl, fullFilename);
            showToast('Saved to custom folder');
            return;
          } else {
            showToast('Permission to write to custom folder was denied.');
          }
        } else {
          showToast('No custom folder configured in Settings.');
        }
      }

      // Default browser download via chrome.downloads to preserve subfolder
      if (chrome.downloads && chrome.downloads.download) {
        chrome.downloads.download(
          {
            url: lastCapturedDataUrl,
            filename: fullFilename,
            saveAs: false,
            conflictAction: 'uniquify',
          },
          () => {
            if (chrome.runtime.lastError) {
              const a = document.createElement('a');
              a.href = lastCapturedDataUrl;
              a.download = baseName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
            showToast('Downloaded screenshot');
          }
        );
      } else {
        const a = document.createElement('a');
        a.href = lastCapturedDataUrl;
        a.download = baseName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Downloaded screenshot');
      }
    } catch (err) {
      console.error('Failed to download/save single screenshot:', err);
      showToast(`Save failed: ${err.message}`);
    }
  });
}

if (singleCloseBtn) {
  singleCloseBtn.addEventListener('click', async () => {
    try {
      const currentTab = await chrome.tabs.getCurrent();
      if (currentTab?.id) {
        await chrome.tabs.remove(currentTab.id);
        return;
      }
    } catch {
      // Fallback
    }
    window.close();
  });
}

// ============================================================================
// ANNOTATION STUDIO INTEGRATION
// ============================================================================
function syncTextPalette(props) {
  if (!props) return;
  if (textFontFamily) textFontFamily.value = props.fontFamily || "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
  if (textFontSizeSlider) textFontSizeSlider.value = props.fontSize || 18;
  if (textFontSizeSelect) textFontSizeSelect.value = props.fontSize || 18;
  if (textFontSizeVal) textFontSizeVal.textContent = `${props.fontSize || 18}px`;
  if (textBoldBtn) textBoldBtn.classList.toggle('active', props.isBold !== false);
  if (textItalicBtn) textItalicBtn.classList.toggle('active', !!props.isItalic);
  if (textUnderlineBtn) textUnderlineBtn.classList.toggle('active', !!props.isUnderline);
  if (textStrikethroughBtn) textStrikethroughBtn.classList.toggle('active', !!props.isStrikethrough);

  if (textAlignBtns) {
    textAlignBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.align === (props.textAlign || 'left'));
    });
  }

  const hasBg = props.textBg !== false;
  if (textBgBadgeBtn) textBgBadgeBtn.classList.toggle('active', hasBg);
  if (textBgNoneBtn) textBgNoneBtn.classList.toggle('active', !hasBg);
}

function initAnnotationStudio() {
  if (!annotationStudio) {
    annotationStudio = new AnnotationStudio(annotationViewport, {
      onToolChange: (tool) => {
        annoToolBtns.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        if (tool === 'text') {
          if (annoTextPalette) {
            annoTextPalette.classList.remove('hidden');
            syncTextPalette(annotationStudio.getTextProperties());
          }
        } else {
          // If switching away from text tool and no text note is selected, hide text palette
          if (annoTextPalette) {
            if (annotationStudio.selectedActionIndex === -1 || annotationStudio.actions[annotationStudio.selectedActionIndex]?.type !== 'text') {
              annoTextPalette.classList.add('hidden');
            }
          }
        }
      },
      onTextModeActive: (props) => {
        if (annoTextPalette) {
          annoTextPalette.classList.remove('hidden');
          syncTextPalette(props);
        }
      },
      onSelectionChange: (action) => {
        if (action && action.color) {
          const isPreset = Array.from(colorSwatches).some(s => s.dataset.color.toLowerCase() === action.color.toLowerCase());
          updateSelectedColor(action.color, !isPreset);
        }
        if (action && action.arrowStyle) {
          arrowStyleBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.arrowStyle === action.arrowStyle);
          });
        }
        if (action && action.lineStyle) {
          updateSelectedLineStyle(action.lineStyle);
        }
        if (action && action.width && annoLineWidth) {
          annoLineWidth.value = action.width;
        }
        if (action && action.type === 'text') {
          if (annoTextPalette) {
            annoTextPalette.classList.remove('hidden');
            syncTextPalette(annotationStudio.getTextProperties());
          }
        } else if (annotationStudio.currentTool !== 'text') {
          if (annoTextPalette) {
            annoTextPalette.classList.add('hidden');
          }
        }
      },
    });
  }
}

const LINE_STYLE_DASH_MAP = {
  'solid': '',
  'dashed': '6,4',
  'long-dash': '12,5',
  'dotted': '2,4',
  'dense-dot': '2,2',
  'dash-dot': '8,3,2,3',
};

function updateSelectedLineStyle(style) {
  if (lineStyleBtns) {
    lineStyleBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.lineStyle === style);
    });
  }
  if (annoCurrentLineStyleLine) {
    const dash = LINE_STYLE_DASH_MAP[style] || '';
    if (dash) {
      annoCurrentLineStyleLine.setAttribute('stroke-dasharray', dash);
    } else {
      annoCurrentLineStyleLine.removeAttribute('stroke-dasharray');
    }
  }
  if (annotationStudio) {
    annotationStudio.setLineStyle(style);
  }
}

function updateSelectedColor(color, isCustom = false) {
  if (annoCurrentColorPreview) {
    annoCurrentColorPreview.style.backgroundColor = color;
  }
  colorSwatches.forEach(s => {
    s.classList.toggle('active', !isCustom && s.dataset.color?.toLowerCase() === color?.toLowerCase());
  });
  if (annoCustomColor && annoCustomColor.parentElement) {
    annoCustomColor.parentElement.classList.toggle('active', isCustom);
    annoCustomColor.value = color;
  }
  if (annotationStudio) {
    annotationStudio.setColor(color);
  }
}

async function openAnnotationStudio(imageSource, filename = null) {
  initAnnotationStudio();
  lastCapturedFilename = filename;
  annotationModal.classList.remove('hidden');
  if (shortcutsModal) shortcutsModal.classList.add('hidden');

  try {
    await annotationStudio.loadImage(imageSource);
    // Set default tool to arrow, red color, and solid line style
    selectAnnoTool('arrow');
    updateSelectedColor('#E5484D', false);
    updateSelectedLineStyle('solid');
    if (annoFitSelect) annoFitSelect.value = 'fit';
    if (annoLineWidth) annoLineWidth.value = '4';
  } catch (err) {
    showToast(`Failed to load image into studio: ${err.message}`);
  }
}

annoCloseBtn.addEventListener('click', () => {
  annotationModal.classList.add('hidden');
  if (annoTextPalette) annoTextPalette.classList.add('hidden');
  if (annoArrowPalette) annoArrowPalette.classList.add('hidden');
  if (annoColorPalette) annoColorPalette.classList.add('hidden');
  if (annoLineStylePalette) annoLineStylePalette.classList.add('hidden');
  if (shortcutsModal) shortcutsModal.classList.add('hidden');
});

function selectAnnoTool(tool) {
  annoToolBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });
  if (annotationStudio) {
    annotationStudio.setTool(tool);
  }
}

annoToolBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tool = btn.dataset.tool;
    if (tool === 'arrow') {
      selectAnnoTool('arrow');
      if (annoArrowPalette) {
        annoArrowPalette.classList.toggle('hidden');
      }
      return;
    }
    // Hide arrow palette when switching to other tools
    if (annoArrowPalette) annoArrowPalette.classList.add('hidden');
    selectAnnoTool(tool);
  });
});

// Arrow Style Palette
if (arrowStyleBtns) {
  arrowStyleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      arrowStyleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (annotationStudio) {
        annotationStudio.setArrowStyle(btn.dataset.arrowStyle);
      }
      if (annoArrowPalette) annoArrowPalette.classList.add('hidden');
    });
  });
}

// Color Picker Button (Toggle Popover)
if (annoColorBtn) {
  annoColorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (annoArrowPalette) annoArrowPalette.classList.add('hidden');
    if (annoColorPalette) {
      annoColorPalette.classList.toggle('hidden');
    }
  });
}

// Swatches Click
colorSwatches.forEach(swatch => {
  swatch.addEventListener('click', () => {
    const color = swatch.dataset.color;
    updateSelectedColor(color, false);
    if (annoColorPalette) annoColorPalette.classList.add('hidden');
  });
});

// Custom Color Picker
if (annoCustomColor) {
  const onCustomColorChange = () => {
    const val = annoCustomColor.value;
    updateSelectedColor(val, true);
  };
  annoCustomColor.addEventListener('input', onCustomColorChange);
  annoCustomColor.addEventListener('change', onCustomColorChange);
}

// Close dropdown palettes when clicking outside
document.addEventListener('click', (e) => {
  if (annoArrowPalette && !annoArrowPalette.classList.contains('hidden')) {
    const wrapper = e.target.closest('.arrow-tool-wrapper');
    if (!wrapper) {
      annoArrowPalette.classList.add('hidden');
    }
  }
  if (annoColorPalette && !annoColorPalette.classList.contains('hidden')) {
    const wrapper = e.target.closest('.color-tool-wrapper');
    if (!wrapper) {
      annoColorPalette.classList.add('hidden');
    }
  }
  if (annoLineStylePalette && !annoLineStylePalette.classList.contains('hidden')) {
    const wrapper = e.target.closest('.line-style-wrapper');
    if (!wrapper) {
      annoLineStylePalette.classList.add('hidden');
    }
  }
  if (annoStampPalette && !annoStampPalette.classList.contains('hidden')) {
    const wrapper = e.target.closest('.stamp-style-wrapper');
    if (!wrapper) {
      annoStampPalette.classList.add('hidden');
    }
  }
});

// Stamp tool popover & selection
if (annoStampBtn) {
  annoStampBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (annoArrowPalette) annoArrowPalette.classList.add('hidden');
    if (annoColorPalette) annoColorPalette.classList.add('hidden');
    if (annoLineStylePalette) annoLineStylePalette.classList.add('hidden');
    if (annoStampPalette) annoStampPalette.classList.toggle('hidden');
    if (annotationStudio) annotationStudio.setTool('stamp');
  });
}

if (stampSelectBtns) {
  stampSelectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const stampType = btn.dataset.stamp;
      stampSelectBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (annotationStudio) {
        annotationStudio.currentStamp = stampType;
        annotationStudio.setTool('stamp');
      }
      if (annoStampPalette) annoStampPalette.classList.add('hidden');
    });
  });
}

// Canvas Reorientation Controls
if (annoRotateCw) {
  annoRotateCw.addEventListener('click', () => {
    if (annotationStudio) annotationStudio.rotateCW();
  });
}

if (annoFlipH) {
  annoFlipH.addEventListener('click', () => {
    if (annotationStudio) annotationStudio.flipHorizontal();
  });
}

if (annoFlipV) {
  annoFlipV.addEventListener('click', () => {
    if (annotationStudio) annotationStudio.flipVertical();
  });
}

// Presentation Frame Toggle
if (annoFrameToggle) {
  annoFrameToggle.addEventListener('click', () => {
    if (annotationStudio) {
      const isFramed = annotationStudio.toggleFrame();
      annoFrameToggle.classList.toggle('active', isFramed);
      showToast(isFramed ? 'Presentation card frame enabled' : 'Presentation frame disabled');
    }
  });
}

// Shortcuts Help Modal
if (annoShortcutsBtn) {
  annoShortcutsBtn.addEventListener('click', () => {
    if (shortcutsModal) shortcutsModal.classList.remove('hidden');
  });
}

if (closeShortcutsBtn) {
  closeShortcutsBtn.addEventListener('click', () => {
    if (shortcutsModal) shortcutsModal.classList.add('hidden');
  });
}

if (shortcutsModal) {
  shortcutsModal.addEventListener('click', (e) => {
    if (e.target === shortcutsModal) {
      shortcutsModal.classList.add('hidden');
    }
  });
}

// Line Style Palette Toggle & Selection
if (annoLineStyleBtn) {
  annoLineStyleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (annoArrowPalette) annoArrowPalette.classList.add('hidden');
    if (annoColorPalette) annoColorPalette.classList.add('hidden');
    if (annoLineStylePalette) {
      annoLineStylePalette.classList.toggle('hidden');
    }
  });
}

if (lineStyleBtns) {
  lineStyleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const style = btn.dataset.lineStyle;
      updateSelectedLineStyle(style);
      if (annoLineStylePalette) annoLineStylePalette.classList.add('hidden');
    });
  });
}

if (annoLineWidth) {
  annoLineWidth.addEventListener('change', () => {
    if (annotationStudio) {
      annotationStudio.setStrokeWidth(parseInt(annoLineWidth.value, 10));
    }
  });
}

// Fit & Zoom Dropdown / Buttons
if (annoFitSelect) {
  annoFitSelect.addEventListener('change', () => {
    if (!annotationStudio) return;
    const val = annoFitSelect.value;
    if (val === 'fit') {
      annotationStudio.fitToScreen();
    } else if (val === 'fitWidth') {
      annotationStudio.fitWidth();
    } else if (val === 'fitHeight') {
      annotationStudio.fitHeight();
    } else {
      const scale = parseFloat(val);
      if (!isNaN(scale)) {
        annotationStudio.setZoom(scale);
      }
    }
  });
}

annoZoomIn.addEventListener('click', () => {
  if (annotationStudio) {
    annotationStudio.setZoom(annotationStudio.zoom + 0.15);
  }
});

annoZoomOut.addEventListener('click', () => {
  if (annotationStudio) {
    annotationStudio.setZoom(annotationStudio.zoom - 0.15);
  }
});

// History & Actions
annoUndoBtn.addEventListener('click', () => annotationStudio?.undo());
annoRedoBtn.addEventListener('click', () => annotationStudio?.redo());
annoClearBtn.addEventListener('click', () => annotationStudio?.clear());

// Text Palette Controls
if (textPaletteCloseBtn) {
  textPaletteCloseBtn.addEventListener('click', () => {
    if (annoTextPalette) annoTextPalette.classList.add('hidden');
  });
}

if (textFontFamily) {
  textFontFamily.addEventListener('change', () => {
    if (annotationStudio) {
      annotationStudio.setFontFamily(textFontFamily.value);
    }
  });
}

if (textFontSizeSlider) {
  textFontSizeSlider.addEventListener('input', () => {
    const sz = parseInt(textFontSizeSlider.value, 10);
    if (textFontSizeVal) textFontSizeVal.textContent = `${sz}px`;
    if (textFontSizeSelect) textFontSizeSelect.value = sz;
    if (annotationStudio) annotationStudio.setFontSize(sz);
  });
}

if (textFontSizeSelect) {
  textFontSizeSelect.addEventListener('change', () => {
    const sz = parseInt(textFontSizeSelect.value, 10);
    if (textFontSizeVal) textFontSizeVal.textContent = `${sz}px`;
    if (textFontSizeSlider) textFontSizeSlider.value = sz;
    if (annotationStudio) annotationStudio.setFontSize(sz);
  });
}

if (textBoldBtn) {
  textBoldBtn.addEventListener('click', () => {
    const isBold = !textBoldBtn.classList.contains('active');
    textBoldBtn.classList.toggle('active', isBold);
    if (annotationStudio) annotationStudio.setBold(isBold);
  });
}

if (textItalicBtn) {
  textItalicBtn.addEventListener('click', () => {
    const isItalic = !textItalicBtn.classList.contains('active');
    textItalicBtn.classList.toggle('active', isItalic);
    if (annotationStudio) annotationStudio.setItalic(isItalic);
  });
}

if (textUnderlineBtn) {
  textUnderlineBtn.addEventListener('click', () => {
    const isUnderline = !textUnderlineBtn.classList.contains('active');
    textUnderlineBtn.classList.toggle('active', isUnderline);
    if (annotationStudio) annotationStudio.setUnderline(isUnderline);
  });
}

if (textStrikethroughBtn) {
  textStrikethroughBtn.addEventListener('click', () => {
    const isStrikethrough = !textStrikethroughBtn.classList.contains('active');
    textStrikethroughBtn.classList.toggle('active', isStrikethrough);
    if (annotationStudio) annotationStudio.setStrikethrough(isStrikethrough);
  });
}

if (textAlignBtns) {
  textAlignBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      textAlignBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (annotationStudio) annotationStudio.setTextAlign(btn.dataset.align);
    });
  });
}

if (textBgBadgeBtn && textBgNoneBtn) {
  textBgBadgeBtn.addEventListener('click', () => {
    textBgBadgeBtn.classList.add('active');
    textBgNoneBtn.classList.remove('active');
    if (annotationStudio) annotationStudio.setTextBg(true);
  });

  textBgNoneBtn.addEventListener('click', () => {
    textBgNoneBtn.classList.add('active');
    textBgBadgeBtn.classList.remove('active');
    if (annotationStudio) annotationStudio.setTextBg(false);
  });
}

annoCopyBtn.addEventListener('click', async () => {
  if (!annotationStudio) return;
  try {
    await annotationStudio.copyToClipboard();
    showToast('Copied annotated image');
  } catch (err) {
    showToast('Failed to copy to clipboard.');
  }
});

annoSaveBtn.addEventListener('click', async () => {
  if (!annotationStudio) return;
  try {
    const { settings } = await chrome.storage.sync.get('settings');
    const dataUrl = annotationStudio.toDataURL('image/png');

    let subfolder = '';
    let baseName = '';

    if (lastCapturedFilename && lastCapturedFilename.includes('/')) {
      const parts = lastCapturedFilename.split('/');
      baseName = parts.pop().replace(/\.[^/.]+$/, '');
      subfolder = parts.join('/') + '/';
    } else if (lastCapturedFilename) {
      baseName = lastCapturedFilename.replace(/\.[^/.]+$/, '');
      subfolder = settings?.subfolder ? `${settings.subfolder}/` : '';
    } else {
      baseName = `screenshot_${Date.now()}`;
      subfolder = settings?.subfolder ? `${settings.subfolder}/` : '';
    }

    const fullFilename = `${subfolder}annotated_${baseName}.png`;
    const simpleFilename = `annotated_${baseName}.png`;

    if (settings?.saveLocation === 'custom') {
      const dirHandle = await loadDirectoryHandle();
      if (dirHandle) {
        const hasPerm = await verifyPermission(dirHandle, true);
        if (hasPerm) {
          await saveToCustomDirectory(dirHandle, dataUrl, fullFilename);
          showToast('Saved to custom folder');
          return;
        } else {
          showToast('Permission to write to custom folder was denied.');
        }
      } else {
        showToast('No custom folder configured in Settings.');
      }
    }

    // Default browser download via chrome.downloads to preserve configured subfolder
    if (chrome.downloads && chrome.downloads.download) {
      chrome.downloads.download(
        {
          url: dataUrl,
          filename: fullFilename,
          saveAs: false,
          conflictAction: 'uniquify',
        },
        () => {
          if (chrome.runtime.lastError) {
            // Fallback via anchor tag download
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = simpleFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
          showToast('Downloaded annotated screenshot');
        }
      );
    } else {
      await annotationStudio.download(simpleFilename);
      showToast('Downloaded annotated screenshot');
    }
  } catch (err) {
    console.error('Annotation save error:', err);
    showToast(`Save failed: ${err.message}`);
  }
});

if (uploadBtn) {
  uploadBtn.addEventListener('click', () => {
    if (imageFileInput) imageFileInput.click();
  });
}

if (dropzoneSelectBtn) {
  dropzoneSelectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (imageFileInput) imageFileInput.click();
  });
}

if (uploadDropzoneCard) {
  uploadDropzoneCard.addEventListener('click', () => {
    if (imageFileInput) imageFileInput.click();
  });
}

// Direct Image Upload / Paste
imageFileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    openAnnotationStudio(event.target.result, file.name);
  };
  reader.readAsDataURL(file);
  imageFileInput.value = '';
});

// Drag & Drop Image File Support
window.addEventListener('dragover', (e) => {
  e.preventDefault();
});

window.addEventListener('drop', (e) => {
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    e.preventDefault();
    const reader = new FileReader();
    reader.onload = (event) => {
      openAnnotationStudio(event.target.result, file.name);
    };
    reader.readAsDataURL(file);
  }
});

// Global Paste Listener (Ctrl+V / Cmd+V) anywhere on the window
window.addEventListener('paste', async (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          openAnnotationStudio(event.target.result, `pasted_${Date.now()}.png`);
          showToast('Pasted image into studio');
        };
        reader.readAsDataURL(file);
        e.preventDefault();
        break;
      }
    }
  }
});

// ============================================================================
// BATCH CAPTURE (URL Parsing, Progress, Logs, Report)
// ============================================================================
function parseUrls(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const jobs = [];

  for (const line of lines) {
    const match = line.match(/^(https?:\/\/\S+)\s*(?:\[([^\]]+)\])?\s*$/i);
    if (match) {
      const url = match[1];
      const name = match[2] ? match[2].trim() : null;
      jobs.push({ url, name });
    }
  }
  return jobs;
}

function updateUrlCount() {
  const jobs = parseUrls(urlInput.value);
  urlCountNum.textContent = jobs.length;
}

function addLog(message, type = 'info') {
  const icons = {
    info: '●',
    success: '✓',
    error: '✗',
    waiting: '◎',
  };

  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `<span class="icon">${icons[type] || '●'}</span><span>${escapeHtml(message)}</span>`;
  logEl.appendChild(entry);

  const container = document.getElementById('log-container');
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function clearLog() {
  logEl.innerHTML = '';
}

function showProgress() {
  progressSection.classList.remove('hidden');
}

function updateProgress(state) {
  if (!state) return;

  const { status, completed, total, currentUrl } = state;

  progressCounter.textContent = `${completed || 0} / ${total || 0}`;

  const pct = total > 0 ? ((completed || 0) / total) * 100 : 0;
  progressBar.style.width = `${pct}%`;

  if (currentUrl) {
    currentUrlEl.textContent = currentUrl;
  } else {
    currentUrlEl.textContent = '';
  }

  progressStatus.className = 'status-badge';

  if (status === 'running') {
    batchInputSection.classList.add('hidden');
    progressSection.classList.remove('hidden');
    reportSection.classList.add('hidden');
    if (batchControls) batchControls.classList.remove('hidden');
    progressStatus.textContent = 'Processing';
    progressStatus.classList.add('processing');
    if (startBtn) startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
  } else if (status === 'waiting') {
    batchInputSection.classList.add('hidden');
    progressSection.classList.remove('hidden');
    reportSection.classList.add('hidden');
    if (batchControls) batchControls.classList.remove('hidden');
    progressStatus.textContent = 'Waiting';
    progressStatus.classList.add('processing');
    if (startBtn) startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
  } else if (status === 'completed' || status === 'stopped') {
    batchInputSection.classList.add('hidden');
    progressSection.classList.add('hidden');
    if (batchControls) batchControls.classList.add('hidden');
    showReport(state);
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
  } else {
    batchInputSection.classList.remove('hidden');
    progressSection.classList.add('hidden');
    reportSection.classList.add('hidden');
    if (batchControls) batchControls.classList.remove('hidden');
    progressStatus.textContent = status || 'Idle';
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
  }
}

function formatDuration(ms) {
  if (!ms || ms < 0) return '0s';
  const totalSecs = Math.floor(ms / 1000);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function showReport(state) {
  if (!state) return;
  if (batchControls) batchControls.classList.add('hidden');
  reportSection.classList.remove('hidden');

  const results = state.results || [];
  lastReportResults = results;

  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  reportTotal.textContent = results.length;
  reportSuccess.textContent = successCount;
  reportFailed.textContent = failedCount;

  const durationMs = (state.endTime && state.startTime) ? (state.endTime - state.startTime) : 0;
  reportDuration.textContent = formatDuration(durationMs);

  reportTableBody.innerHTML = '';
  results.forEach((res, index) => {
    const tr = document.createElement('tr');

    // Helper to retrieve full resolution screenshot data URL
    const getFullScreenshot = async () => {
      if (res.dataUrl) return res.dataUrl;

      const filenameBase = res.filename && res.filename.includes('/') ? res.filename.split('/').pop() : null;

      // 1. Direct read from popup in-memory cache
      if (res.filename && localScreenshotCache.has(res.filename)) {
        return localScreenshotCache.get(res.filename);
      }
      if (filenameBase && localScreenshotCache.has(filenameBase)) {
        return localScreenshotCache.get(filenameBase);
      }
      if (res.url && localScreenshotCache.has(res.url)) {
        return localScreenshotCache.get(res.url);
      }

      // 2. Direct read from IndexedDB
      if (typeof loadCachedScreenshot === 'function') {
        try {
          const cached = (await loadCachedScreenshot(res.filename)) ||
                         (filenameBase ? await loadCachedScreenshot(filenameBase) : null) ||
                         (await loadCachedScreenshot(res.url));
          if (cached) {
            if (res.filename) localScreenshotCache.set(res.filename, cached);
            return cached;
          }
        } catch {
          // Ignore IndexedDB read error
        }
      }

      // 3. Query service worker in-memory cache
      try {
        const resp = await chrome.runtime.sendMessage({
          type: 'GET_SCREENSHOT_DATA',
          filename: res.filename,
          url: res.url,
        });
        if (resp && resp.dataUrl) {
          if (res.filename) localScreenshotCache.set(res.filename, resp.dataUrl);
          return resp.dataUrl;
        }
      } catch {
        // Ignore cache fetch error
      }

      return null;
    };

    // 1. Index
    const tdIndex = document.createElement('td');
    tdIndex.className = 'index-cell';
    tdIndex.textContent = index + 1;
    tr.appendChild(tdIndex);

    // 2. Thumbnail
    const tdThumb = document.createElement('td');
    tdThumb.className = 'table-thumb-cell';

    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'table-thumb-wrapper';
    thumbWrap.title = res.status === 'success' ? 'Click to open in Annotation Studio' : (res.error || 'Capture failed');

    const img = document.createElement('img');
    img.className = 'table-thumb-img';
    img.alt = res.name || res.url || 'Screenshot thumbnail';

    // Neutral fallback placeholder image data URL
    const placeholderImg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="40" viewBox="0 0 64 40" fill="none"><rect width="64" height="40" fill="#010f1f"/><rect x="22" y="10" width="20" height="20" rx="3" stroke="#89ceff" stroke-width="1.5" stroke-opacity="0.5"/><circle cx="28" cy="16" r="1.5" fill="#89ceff" fill-opacity="0.7"/><path d="M40 25L35 20L25 29" stroke="#89ceff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.7"/></svg>');
    const errorImg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="40" viewBox="0 0 64 40" fill="none"><rect width="64" height="40" fill="#200d11"/><circle cx="32" cy="20" r="10" stroke="#ef4444" stroke-width="1.5" stroke-opacity="0.8"/><line x1="32" y1="15" x2="32" y2="21" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/><circle cx="32" cy="25" r="1" fill="#ef4444"/></svg>');

    if (res.status === 'success') {
      img.src = res.thumbnail || res.dataUrl || placeholderImg;
      img.onerror = () => {
        img.onerror = null;
        img.src = placeholderImg;
      };

      thumbWrap.addEventListener('click', async () => {
        const imageSource = await getFullScreenshot();
        if (imageSource) {
          openAnnotationStudio(imageSource, res.filename);
        } else {
          showToast('Could not load full-resolution screenshot.');
        }
      });
    } else {
      img.src = errorImg;
      img.onerror = () => {
        img.onerror = null;
        img.src = errorImg;
      };
      thumbWrap.style.cursor = 'default';
    }

    thumbWrap.appendChild(img);
    tdThumb.appendChild(thumbWrap);
    tr.appendChild(tdThumb);

    // 3. Target URL / Name
    const tdUrl = document.createElement('td');
    tdUrl.className = 'url-cell';
    const link = document.createElement('a');
    link.href = res.url;
    link.target = '_blank';
    link.textContent = res.name ? `${res.name} (${res.url})` : res.url;
    link.title = res.url;
    tdUrl.appendChild(link);
    tr.appendChild(tdUrl);

    // 4. Status
    const tdStatus = document.createElement('td');
    tdStatus.className = 'status-cell';
    const badge = document.createElement('span');
    badge.className = `badge ${res.status}`;
    badge.textContent = res.status === 'success' ? 'Success' : 'Failed';
    tdStatus.appendChild(badge);
    tr.appendChild(tdStatus);

    // 5. Output Details
    const tdDetails = document.createElement('td');
    if (res.status === 'success') {
      tdDetails.className = 'file-name';
      tdDetails.textContent = res.filename || 'Saved';
      tdDetails.title = res.filename || 'Saved';
    } else {
      tdDetails.className = 'error-msg';
      tdDetails.textContent = res.error || 'Unknown error';
      tdDetails.title = res.error || 'Unknown error';
    }
    tr.appendChild(tdDetails);

    // 6. Action (Separate Column)
    const tdAction = document.createElement('td');
    tdAction.className = 'table-action-cell';
    if (res.status === 'success') {
      const annotateBtn = document.createElement('button');
      annotateBtn.type = 'button';
      annotateBtn.className = 'table-action-btn';
      annotateBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/></svg><span>Annotate</span>';
      annotateBtn.title = 'Open in Annotation Studio';
      annotateBtn.addEventListener('click', async () => {
        try {
          annotateBtn.innerHTML = '<span>Loading...</span>';
          const imageSource = await getFullScreenshot();
          if (imageSource) {
            openAnnotationStudio(imageSource, res.filename);
            return;
          }
          showToast('Could not load full-resolution screenshot.');
        } catch (err) {
          showToast(`Error: ${err.message}`);
        } finally {
          annotateBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/></svg><span>Annotate</span>';
        }
      });
      tdAction.appendChild(annotateBtn);
    } else {
      const dash = document.createElement('span');
      dash.className = 'text-muted';
      dash.textContent = '—';
      tdAction.appendChild(dash);
    }
    tr.appendChild(tdAction);

    reportTableBody.appendChild(tr);
  });
}

async function updateFolderIndicator() {
  const { settings } = await chrome.storage.sync.get('settings');
  if (settings?.saveLocation === 'custom') {
    const handle = await loadDirectoryHandle();
    if (handle) {
      customFolderIndicator.classList.add('hidden');
    } else {
      customFolderIndicatorText.textContent = 'Custom save directory is selected, but no folder is configured.';
      customFolderIndicator.classList.remove('hidden');
    }
  } else {
    customFolderIndicator.classList.add('hidden');
  }
}

// URL input listener
urlInput.addEventListener('input', () => {
  updateUrlCount();
  chrome.storage.local.set({ urlInputText: urlInput.value });
});

if (startBtn) {
  startBtn.addEventListener('click', async () => {
    const jobs = parseUrls(urlInput.value);

    if (jobs.length === 0) {
      addLog('No valid URLs found. Check your input.', 'error');
      return;
    }

    const { settings } = await chrome.storage.sync.get('settings');
    let dirHandle = null;
    if (settings?.saveLocation === 'custom') {
      dirHandle = await loadDirectoryHandle();
      if (!dirHandle) {
        addLog('Prompting for custom destination folder...', 'info');
        try {
          dirHandle = await window.showDirectoryPicker();
          await saveDirectoryHandle(dirHandle);
          await updateFolderIndicator();
        } catch (err) {
          addLog('Directory selection cancelled. Cannot start capture.', 'error');
          return;
        }
      }

      const hasPermission = await verifyPermission(dirHandle, true);
      if (!hasPermission) {
        addLog('Permission denied for custom directory. Cannot start capture.', 'error');
        return;
      }
    }

    const batchDir = typeof determineNextBatchDir === 'function'
      ? await determineNextBatchDir(settings, dirHandle)
      : 'batch-01';

    clearLog();
    showProgress();
    batchInputSection.classList.add('hidden');
    reportSection.classList.add('hidden');
    addLog(`Starting capture of ${jobs.length} URL(s) into [${batchDir}]...`, 'info');

    startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;

    const response = await chrome.runtime.sendMessage({
      type: 'START_CAPTURE',
      jobs,
      batchDir,
    });

    if (response && response.error) {
      addLog(`Error: ${response.error}`, 'error');
      startBtn.disabled = false;
      if (stopBtn) stopBtn.disabled = true;
    }
  });
}

if (stopBtn) {
  stopBtn.addEventListener('click', async () => {
    stopBtn.disabled = true;
    addLog('Stopping...', 'waiting');
    await chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' });
  });
}

// Settings Navigation: Focus existing tab or create new tab
settingsBtn.addEventListener('click', async () => {
  const url = chrome.runtime.getURL('settings/settings.html');
  try {
    const tabs = await chrome.tabs.query({ url });
    if (tabs.length > 0) {
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId, { drawAttention: true, focused: true });
    } else {
      await chrome.tabs.create({ url });
    }
  } catch (err) {
    chrome.runtime.openOptionsPage();
  }
});

fixFolderBtn.addEventListener('click', async () => {
  try {
    const handle = await window.showDirectoryPicker();
    await saveDirectoryHandle(handle);
    await updateFolderIndicator();
  } catch (err) {
    console.error('Directory selection cancelled:', err);
  }
});

closeReportBtn.addEventListener('click', async () => {
  await chrome.storage.session.remove('captureState');
  reportSection.classList.add('hidden');
  progressSection.classList.add('hidden');
  batchInputSection.classList.remove('hidden');
  if (batchControls) batchControls.classList.remove('hidden');
  updateUrlCount();
});

if (newBatchBtn) {
  newBatchBtn.addEventListener('click', async () => {
    await chrome.storage.session.remove('captureState');
    reportSection.classList.add('hidden');
    progressSection.classList.add('hidden');
    batchInputSection.classList.remove('hidden');
    if (batchControls) batchControls.classList.remove('hidden');
    updateUrlCount();
    if (urlInput) {
      urlInput.focus();
    }
  });
}

exportCsvBtn.addEventListener('click', () => {
  if (lastReportResults.length === 0) return;

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Index,URL,Name,Status,Filename/Error,Timestamp\n';

  lastReportResults.forEach((res, index) => {
    const details = res.status === 'success' ? (res.filename || '') : (res.error || '');
    const row = [
      index + 1,
      `"${res.url.replace(/"/g, '""')}"`,
      `"${(res.name || '').replace(/"/g, '""')}"`,
      res.status,
      `"${details.replace(/"/g, '""')}"`,
      new Date(res.timestamp).toISOString(),
    ].join(',');
    csvContent += row + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `capture_report_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

exportJsonBtn.addEventListener('click', () => {
  if (lastReportResults.length === 0) return;

  const jsonContent = JSON.stringify(lastReportResults, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `capture_report_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

// State changes listener
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'local' && changes.lastCapturedResult?.newValue) {
    const newResult = changes.lastCapturedResult.newValue;
    if (newResult && newResult.dataUrl) {
      await chrome.storage.local.remove('lastCapturedResult');
      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode');
      if (newResult.isUploaded || modeParam === 'annotate' || urlParams.get('annotate') === '1') {
        openAnnotationStudio(newResult.dataUrl, newResult.filename);
      } else {
        lastCapturedDataUrl = newResult.dataUrl;
        lastCapturedFilename = newResult.filename;
        displaySingleResult(newResult);
        switchMode('single');
      }
    }
  }

  if (areaName === 'session' && changes.captureState) {
    const state = changes.captureState.newValue;
    if (state) {
      updateProgress(state);

      if (state.lastLog) {
        addLog(state.lastLog.message, state.lastLog.type);
      }
    } else {
      reportSection.classList.add('hidden');
      progressSection.classList.add('hidden');
      batchInputSection.classList.remove('hidden');
      if (batchControls) batchControls.classList.remove('hidden');
    }
  }
});

// Runtime message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CACHE_SCREENSHOT') {
    if (message.dataUrl) {
      if (message.filename) localScreenshotCache.set(message.filename, message.dataUrl);
      if (typeof message.filename === 'string' && message.filename.includes('/')) {
        const base = message.filename.split('/').pop();
        if (base) localScreenshotCache.set(base, message.dataUrl);
      }
      if (message.url) localScreenshotCache.set(message.url, message.dataUrl);
    }
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === 'SAVE_CUSTOM_SCREENSHOT') {
    (async () => {
      try {
        if (message.dataUrl) {
          if (message.filename) localScreenshotCache.set(message.filename, message.dataUrl);
          if (typeof message.filename === 'string' && message.filename.includes('/')) {
            const base = message.filename.split('/').pop();
            if (base) localScreenshotCache.set(base, message.dataUrl);
          }
          if (message.url) localScreenshotCache.set(message.url, message.dataUrl);
          if (typeof saveCachedScreenshot === 'function') {
            await saveCachedScreenshot(message.filename, message.dataUrl, message.url);
          }
        }

        const dirHandle = await loadDirectoryHandle();
        if (!dirHandle) {
          throw new Error('No custom save directory configured. Please configure it in settings.');
        }

        const hasPermission = await verifyPermission(dirHandle, true);
        if (!hasPermission) {
          throw new Error('Permission to write to the custom directory was denied.');
        }

        await saveToCustomDirectory(dirHandle, message.dataUrl, message.filename);
        sendResponse({ ok: true });
      } catch (err) {
        console.error('Failed to save custom screenshot:', err);
        sendResponse({ error: err.message });
      }
    })();
    return true;
  }
});

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  // Handle URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const modeParam = urlParams.get('mode');

  // Restore textarea
  const { urlInputText = '' } = await chrome.storage.local.get('urlInputText');
  if (urlInput) {
    urlInput.value = urlInputText;
    updateUrlCount();
  }

  await updateFolderIndicator();

  // Check if opened after single capture via menu / context menu
  let isSingleMode = false;
  const { lastCapturedResult } = await chrome.storage.local.get('lastCapturedResult');
  if (lastCapturedResult && lastCapturedResult.dataUrl) {
    // Clear pending result from storage so it does not linger
    await chrome.storage.local.remove('lastCapturedResult');

    // Auto-save to custom directory if single capture was marked to save
    if (lastCapturedResult.saved) {
      const { settings } = await chrome.storage.sync.get('settings');
      if (settings?.saveLocation === 'custom') {
        try {
          const dirHandle = await loadDirectoryHandle();
          if (dirHandle && (await verifyPermission(dirHandle, true))) {
            await saveToCustomDirectory(dirHandle, lastCapturedResult.dataUrl, lastCapturedResult.filename);
            showToast('Saved to custom folder');
          }
        } catch (err) {
          console.warn('Auto-save to custom directory failed:', err);
        }
      }
    }

    if (urlParams.get('upload') === '1') {
      switchMode('batch');
    } else if (modeParam === 'annotate' || urlParams.get('annotate') === '1' || lastCapturedResult.isUploaded) {
      openAnnotationStudio(lastCapturedResult.dataUrl, lastCapturedResult.filename);
    } else {
      displaySingleResult(lastCapturedResult);
      isSingleMode = true;
    }
  } else if (modeParam === 'annotate' || urlParams.get('annotate') === '1') {
    switchMode('annotate');
  } else if (modeParam === 'single') {
    switchMode('single');
    isSingleMode = true;
  } else {
    switchMode('batch');
  }

  // Restore progress state
  const { captureState } = await chrome.storage.session.get('captureState');
  if (captureState) {
    if (captureState.status === 'running' || captureState.status === 'waiting') {
      updateProgress(captureState);
      if (batchControls) batchControls.classList.remove('hidden');
      if (captureState.logHistory) {
        for (const entry of captureState.logHistory) {
          addLog(entry.message, entry.type);
        }
      }
    } else {
      // Completed or stopped session: clean up so batch view is fresh for new captures
      await chrome.storage.session.remove('captureState');
      if (!isSingleMode) {
        if (batchInputSection) batchInputSection.classList.remove('hidden');
        if (batchControls) batchControls.classList.remove('hidden');
        if (progressSection) progressSection.classList.add('hidden');
        if (reportSection) reportSection.classList.add('hidden');
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
      }
    }
  } else {
    if (!isSingleMode) {
      if (batchInputSection) batchInputSection.classList.remove('hidden');
      if (batchControls) batchControls.classList.remove('hidden');
    }
    if (progressSection) progressSection.classList.add('hidden');
    if (reportSection) reportSection.classList.add('hidden');
  }
});

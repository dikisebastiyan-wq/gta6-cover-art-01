// Editor: owns the cover state, the undo/redo history, photo loading, panel
// dragging and the PNG export. The drawing itself lives in cover.js.

import {
  COVER_LAYOUTS,
  COVER_GRADES,
  EXPORT_SIZES,
  coverPanelRects,
  defaultCoverState,
  panelsForLayout,
  drawCover,
} from './cover.js';

const SAMPLE_PHOTOS = [
  { name: 'Boulevard', url: './samples/boulevard.jpg' },
  { name: 'Pier', url: './samples/pier.jpg' },
];

export function createCoverEditor(canvas) {
  const ctx = canvas.getContext('2d');
  let state = defaultCoverState();
  let photos = [];
  let pickedPhoto = 0;
  let past = [];
  let future = [];
  let dragging = null;
  // A snapshot taken before a drag or slider move, so undo restores the
  // state from before the gesture, not the state after it.
  let pendingUndoSnapshot = null;

  function snapshot() {
    return JSON.parse(JSON.stringify(state));
  }

  function armUndo() {
    if (pendingUndoSnapshot === null) pendingUndoSnapshot = snapshot();
  }

  function commitUndo() {
    if (pendingUndoSnapshot !== null) {
      past.push(pendingUndoSnapshot);
      if (past.length > 60) past.shift();
      future = [];
      pendingUndoSnapshot = null;
      refreshHistoryButtons();
    }
  }

  function remember() {
    past.push(snapshot());
    if (past.length > 60) past.shift();
    future = [];
    refreshHistoryButtons();
  }

  function restore(next) {
    state = next;
    state.panels = panelsForLayout(state.layout, state.panels);
    drawPreview();
    syncControls();
    refreshHistoryButtons();
  }

  function undoCover() {
    if (!past.length) return;
    future.push(snapshot());
    restore(past.pop());
    announce('Undone.');
  }

  function redoCover() {
    if (!future.length) return;
    past.push(snapshot());
    restore(future.pop());
    announce('Redone.');
  }

  function previewSize() {
    const size = EXPORT_SIZES[state.size];
    const scale = 720 / size.width;
    return { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
  }

  function drawPreview() {
    const { width, height } = previewSize();
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    drawCover(ctx, state, photos, width, height);
  }

  function announce(message) {
    const line = document.getElementById('statusLine');
    if (line) line.textContent = message;
  }

  function refreshHistoryButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.disabled = past.length === 0;
    if (redoBtn) redoBtn.disabled = future.length === 0;
  }

  function syncControls() {
    const byId = (id) => document.getElementById(id);
    const titleInput = byId('titleInput');
    if (titleInput) titleInput.value = state.title;
    const subtitleInput = byId('subtitleInput');
    if (subtitleInput) subtitleInput.value = state.subtitle;
    const sizeSelect = byId('sizeSelect');
    if (sizeSelect) sizeSelect.value = state.size;
    const titleSizeSlider = byId('titleSizeSlider');
    if (titleSizeSlider) titleSizeSlider.value = String(state.titleSize);
    const titlePosSelect = byId('titlePosSelect');
    if (titlePosSelect) titlePosSelect.value = state.titlePosition;
    const gradeSlider = byId('gradeSlider');
    if (gradeSlider) gradeSlider.value = String(state.gradeStrength);
    const grainCheck = byId('grainCheck');
    if (grainCheck) grainCheck.checked = state.grain;
    const palmsCheck = byId('palmsCheck');
    if (palmsCheck) palmsCheck.checked = state.palms;
    document.querySelectorAll('#layoutRow [data-layout]').forEach((button) => {
      button.classList.toggle('active', button.dataset.layout === state.layout);
    });
    document.querySelectorAll('#gradeRow [data-grade]').forEach((button) => {
      button.classList.toggle('active', button.dataset.grade === state.grade);
    });
    document.querySelectorAll('#titleStyleRow [data-title-style]').forEach((button) => {
      button.classList.toggle('active', button.dataset.titleStyle === state.titleStyle);
    });
    const panel = state.panels[state.selectedPanel];
    const zoomSlider = byId('zoomSlider');
    if (zoomSlider && panel) zoomSlider.value = String(panel.zoom);
    const selectedLabel = byId('selectedPanelLabel');
    if (selectedLabel) selectedLabel.textContent = String(state.selectedPanel + 1);
    const countLabel = byId('panelCountLabel');
    if (countLabel) countLabel.textContent = String(state.panels.length);
  }

  function loadImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function loadImageUrl(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
  }

  async function addPhotosFromFiles(files) {
    const fresh = [];
    for (const file of files) {
      try {
        fresh.push(await loadImageFile(file));
      } catch (error) {
        announce(`Could not read ${file.name}.`);
      }
    }
    if (fresh.length) {
      remember();
      photos = photos.concat(fresh);
      pickedPhoto = photos.length - fresh.length;
      fillEmptyPanelsWith(pickedPhoto);
      pointPanelsAtLoadedPhotos();
      rebuildPhotoTray();
      drawPreview();
      announce(`${fresh.length} photo${fresh.length > 1 ? 's' : ''} loaded.`);
    }
  }

  async function loadSamplePhoto(index) {
    const sample = SAMPLE_PHOTOS[index];
    if (!sample) return;
    try {
      const image = await loadImageUrl(sample.url);
      remember();
      photos.push(image);
      pickedPhoto = photos.length - 1;
      fillEmptyPanelsWith(pickedPhoto);
      pointPanelsAtLoadedPhotos();
      rebuildPhotoTray();
      drawPreview();
      announce(`${sample.name} sample loaded.`);
    } catch (error) {
      announce(`Could not load the ${sample.name} sample.`);
    }
  }

  function fillEmptyPanelsWith(photoIndex) {
    state.panels.forEach((panel) => {
      if (panel.photo === null) panel.photo = photoIndex;
    });
  }

  // Every panel must point at a photo that actually exists: after the
  // layout grows, point panels with no photo at the loaded photos in turn
  // so no panel stays an empty gradient. Panels that already name a photo
  // keep it — the renderer wraps out-of-range names onto loaded photos.
  function pointPanelsAtLoadedPhotos() {
    if (!photos.length) return;
    state.panels.forEach((panel, i) => {
      if (panel.photo === null) {
        panel.photo = i % photos.length;
      }
    });
  }

  function rebuildPhotoTray() {
    const tray = document.getElementById('photoTray');
    if (!tray) return;
    tray.innerHTML = '';
    photos.forEach((image, index) => {
      const thumb = document.createElement('img');
      thumb.src = image.src;
      thumb.alt = `Photo ${index + 1}`;
      thumb.classList.toggle('picked', index === pickedPhoto);
      thumb.addEventListener('click', () => {
        pickedPhoto = index;
        rebuildPhotoTray();
      });
      tray.appendChild(thumb);
    });
  }

  function usePickedPhotoInSelectedPanel() {
    if (!photos.length) {
      announce('Load a photo first.');
      return;
    }
    remember();
    state.panels[state.selectedPanel].photo = pickedPhoto;
    drawPreview();
    announce(`Photo ${pickedPhoto + 1} placed in panel ${state.selectedPanel + 1}.`);
  }

  function fillAllPanelsWithPickedPhoto() {
    if (!photos.length) {
      announce('Load a photo first.');
      return;
    }
    remember();
    state.panels.forEach((panel) => { panel.photo = pickedPhoto; });
    drawPreview();
    announce(`All panels now use photo ${pickedPhoto + 1}.`);
  }

  function pickPanelAt(clientX, clientY) {
    const box = canvas.getBoundingClientRect();
    const x = (clientX - box.left) / box.width;
    const y = (clientY - box.top) / box.height;
    const rects = coverPanelRects(state.layout);
    const hit = rects.findIndex(([rx, ry, rw, rh]) => x >= rx && x < rx + rw && y >= ry && y < ry + rh);
    return hit === -1 ? 0 : hit;
  }

  function attachCanvasDragging() {
    canvas.addEventListener('pointerdown', (event) => {
      const panelIndex = pickPanelAt(event.clientX, event.clientY);
      state.selectedPanel = panelIndex;
      syncControls();
      armUndo();
      const panel = state.panels[panelIndex];
      dragging = {
        panelIndex,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: panel.offsetX,
        offsetY: panel.offsetY,
        moved: false,
      };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const box = canvas.getBoundingClientRect();
      const dx = (event.clientX - dragging.startX) / box.width;
      const dy = (event.clientY - dragging.startY) / box.height;
      if (Math.abs(dx) > 0.005 || Math.abs(dy) > 0.005) dragging.moved = true;
      const panel = state.panels[dragging.panelIndex];
      panel.offsetX = Math.max(-1, Math.min(1, dragging.offsetX + dx * 2.4));
      panel.offsetY = Math.max(-1, Math.min(1, dragging.offsetY + dy * 2.4));
      drawPreview();
    });
    canvas.addEventListener('pointerup', () => {
      if (dragging && dragging.moved) commitUndo();
      else pendingUndoSnapshot = null;
      dragging = null;
    });
  }

  function randomizeCover() {
    remember();
    const layoutIds = Object.keys(COVER_LAYOUTS);
    const gradeIds = Object.keys(COVER_GRADES);
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    state.layout = pick(layoutIds);
    state.grade = pick(gradeIds);
    state.titlePosition = pick(['top', 'middle', 'bottom']);
    state.titleStyle = pick(['outline', 'sunset', 'neon']);
    state.gradeStrength = 0.4 + Math.random() * 0.5;
    state.panels = panelsForLayout(state.layout, state.panels);
    pointPanelsAtLoadedPhotos();
    state.panels.forEach((panel) => {
      panel.zoom = 1.05 + Math.random() * 0.7;
      panel.offsetX = (Math.random() - 0.5) * 0.6;
      panel.offsetY = (Math.random() - 0.5) * 0.6;
    });
    drawPreview();
    syncControls();
    announce('Shuffled! A fresh cover variant.');
  }

  async function exportCoverPng() {
    const size = EXPORT_SIZES[state.size];
    await document.fonts.ready;
    const offscreen = document.createElement('canvas');
    offscreen.width = size.width;
    offscreen.height = size.height;
    drawCover(offscreen.getContext('2d'), state, photos, size.width, size.height);
    const blob = await new Promise((resolve) => offscreen.toBlob(resolve, 'image/png'));
    if (!blob) {
      announce('Export failed — the browser could not make the PNG.');
      return null;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neon-shore-cover-${size.width}x${size.height}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    announce(`Exported ${size.width} × ${size.height} PNG.`);
    return blob;
  }

  function wireControls() {
    const on = (id, eventName, handler) => {
      const element = document.getElementById(id);
      if (element) element.addEventListener(eventName, handler);
    };
    on('photoInput', 'change', (event) => addPhotosFromFiles([...event.target.files]));
    on('sampleBoulevardBtn', 'click', () => loadSamplePhoto(0));
    on('samplePierBtn', 'click', () => loadSamplePhoto(1));
    on('usePhotoBtn', 'click', usePickedPhotoInSelectedPanel);
    on('fillAllBtn', 'click', fillAllPanelsWithPickedPhoto);
    on('zoomSlider', 'input', (event) => {
      state.panels[state.selectedPanel].zoom = Number(event.target.value);
      drawPreview();
    });
    on('zoomSlider', 'focus', armUndo);
    on('zoomSlider', 'change', commitUndo);
    on('resetPanelBtn', 'click', () => {
      remember();
      const panel = state.panels[state.selectedPanel];
      panel.zoom = 1.15;
      panel.offsetX = 0;
      panel.offsetY = 0;
      drawPreview();
      syncControls();
    });
    const nudge = (dx, dy) => () => {
      remember();
      const panel = state.panels[state.selectedPanel];
      panel.offsetX = Math.max(-1, Math.min(1, panel.offsetX + dx));
      panel.offsetY = Math.max(-1, Math.min(1, panel.offsetY + dy));
      drawPreview();
    };
    on('nudgeLeftBtn', 'click', nudge(-0.08, 0));
    on('nudgeRightBtn', 'click', nudge(0.08, 0));
    on('nudgeUpBtn', 'click', nudge(0, -0.08));
    on('nudgeDownBtn', 'click', nudge(0, 0.08));
    on('titleInput', 'input', (event) => {
      state.title = event.target.value;
      drawPreview();
    });
    on('titleInput', 'focus', armUndo);
    on('titleInput', 'change', commitUndo);
    on('subtitleInput', 'input', (event) => {
      state.subtitle = event.target.value;
      drawPreview();
    });
    on('subtitleInput', 'focus', armUndo);
    on('subtitleInput', 'change', commitUndo);
    on('titleSizeSlider', 'input', (event) => {
      state.titleSize = Number(event.target.value);
      drawPreview();
    });
    on('titleSizeSlider', 'focus', armUndo);
    on('titleSizeSlider', 'change', commitUndo);
    on('titlePosSelect', 'change', (event) => {
      remember();
      state.titlePosition = event.target.value;
      drawPreview();
    });
    on('sizeSelect', 'change', (event) => {
      remember();
      state.size = event.target.value;
      drawPreview();
      syncControls();
    });
    on('gradeSlider', 'input', (event) => {
      state.gradeStrength = Number(event.target.value);
      drawPreview();
    });
    on('gradeSlider', 'focus', armUndo);
    on('gradeSlider', 'change', commitUndo);
    on('grainCheck', 'change', (event) => {
      remember();
      state.grain = event.target.checked;
      drawPreview();
    });
    on('palmsCheck', 'change', (event) => {
      remember();
      state.palms = event.target.checked;
      drawPreview();
    });
    on('undoBtn', 'click', undoCover);
    on('redoBtn', 'click', redoCover);
    on('randomBtn', 'click', randomizeCover);
    on('exportBtn', 'click', exportCoverPng);
    document.querySelectorAll('#layoutRow [data-layout]').forEach((button) => {
      button.addEventListener('click', () => {
        remember();
        state.layout = button.dataset.layout;
        state.panels = panelsForLayout(state.layout, state.panels);
        pointPanelsAtLoadedPhotos();
        state.selectedPanel = 0;
        drawPreview();
        syncControls();
      });
    });
    document.querySelectorAll('#gradeRow [data-grade]').forEach((button) => {
      button.addEventListener('click', () => {
        remember();
        state.grade = button.dataset.grade;
        drawPreview();
        syncControls();
      });
    });
    document.querySelectorAll('#titleStyleRow [data-title-style]').forEach((button) => {
      button.addEventListener('click', () => {
        remember();
        state.titleStyle = button.dataset.titleStyle;
        drawPreview();
        syncControls();
      });
    });
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redoCover();
        else undoCover();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redoCover();
      }
    });
  }

  function applyScenePreset(scene) {
    // Scene presets are only used by ?shot= modes for screenshots.
    if (scene.photo === 'pier') {
      state.panels.forEach((panel, i) => { panel.photo = 1; });
    }
    if (scene.caption) state.title = scene.caption;
    if (scene.subtitle) state.subtitle = scene.subtitle;
    if (scene.layout) state.layout = scene.layout;
    if (scene.grade) state.grade = scene.grade;
    if (scene.size) state.size = scene.size;
    if (scene.titleStyle) state.titleStyle = scene.titleStyle;
    if (scene.titlePosition) state.titlePosition = scene.titlePosition;
    state.panels = panelsForLayout(state.layout, state.panels);
    pointPanelsAtLoadedPhotos();
  }

  async function loadScenePhotos() {
    // Load both kit samples so every scene has photos to draw with.
    const loaded = [];
    for (const sample of SAMPLE_PHOTOS) {
      try {
        loaded.push(await loadImageUrl(sample.url));
      } catch (error) {
        loaded.push(null);
      }
    }
    photos = loaded.filter(Boolean);
    if (photos.length) {
      state.panels.forEach((panel, i) => {
        if (panel.photo === null) panel.photo = i % photos.length;
      });
    }
    rebuildPhotoTray();
  }

  wireControls();
  attachCanvasDragging();
  drawPreview();
  syncControls();
  refreshHistoryButtons();

  return {
    getState: () => snapshot(),
    getPhotos: () => photos,
    drawPreview,
    syncControls,
    loadSamplePhoto,
    loadScenePhotos,
    applyScenePreset,
    exportCoverPng,
    undoCover,
    redoCover,
    randomizeCover,
    announce,
    addPhotosFromFiles,
  };
}
